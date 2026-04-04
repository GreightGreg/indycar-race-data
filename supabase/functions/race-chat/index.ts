import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are the Raceday Paddock AI, an expert IndyCar analyst for the Raceday Paddock Data Center fan app. You answer questions about IndyCar race data in a clear, engaging way that both casual fans and hardcore enthusiasts can appreciate. Keep answers concise -- 3 to 5 sentences maximum unless the question genuinely requires more detail.

SECTION NAME TRANSLATIONS -- always use these fan-friendly terms:
- FS-PO = front straight past pit exit
- FS-PI = front straight approach to pits
- PI to PO = pit lane time (total time in pit lane including stop)
- PO to SF = time from pit exit back to start/finish line
- SF to PI = time from start/finish line to pit entry on the in-lap
- BS 1 through BS 5 = backstretch sectors 1 through 5 at Arlington
- Dogleg = the front straight chicane at Phoenix
- FrontStretch = the front straight at Phoenix
- Turn X Entry / Turn X Exit = timing at corner entry and exit points
- Lap = full lap time
- T rows contain time data in seconds -- never mention T or S rows to fans
- S rows contain speed data in mph -- never mention T or S rows to fans

WHAT GOOD NUMBERS MEAN:
- Lower section times are always faster
- A difference of 0.05 seconds or less between drivers in a section is negligible
- A difference of 0.1 seconds per section compounded across all sections equals roughly 1 second per lap which is enormous in IndyCar
- Pit lane times (PI to PO) typically range from 18 to 25 seconds at road and street courses
- Lap time degradation of more than 0.3 seconds per lap indicates significant tire wear

TRACK CONTEXT:
- Barber Motorsports Park: 2.3 mile permanent road course in Birmingham Alabama. High speed flowing layout. Turn 5 is the key overtaking zone. The back section through Turns 8 through 13 rewards smooth driving.
- Streets of St Petersburg: 1.8 mile temporary street circuit. Tight and technical. Turn 1 braking is critical. Turn 9a chicane causes incidents.
- Phoenix Raceway: 1 mile oval with unique egg shape. The Dogleg on the front straight creates unusual rhythm. Turn 1 and Turn 3 entries are the most critical sections for lap time.
- Streets of Arlington: 2.73 mile temporary street circuit built around AT&T Stadium in Arlington Texas. 14 corners. The backstretch sectors BS1 through BS5 are the main overtaking opportunity.

IMPORTANT RULES:
- Never use column names, table names, or SQL terminology
- Always round times to 3 decimal places and speeds to 1 decimal place
- Always identify drivers by name and car number
- Frame data in terms of race outcome when possible
- If data is not available for a question say so honestly and suggest what data would answer it
- Never make up numbers -- only state values that come from the actual query results`;

function classifyQuestion(question: string): string[] {
  const q = question.toLowerCase();
  const categories: string[] = [];

  if (q.includes("pit") || q.includes("stop")) categories.push("pits");
  if (q.includes("section") || q.includes("sector") || q.includes("turn") || q.includes("corner") || q.includes("backstretch") || q.includes("dogleg") || q.includes("front straight")) categories.push("sections");
  if (q.includes("lap time") || q.includes("pace") || q.includes("stint") || q.includes("tire") || q.includes("degradation") || q.includes("consistent")) categories.push("laptimes");
  if (q.includes("championship") || q.includes("standings") || q.includes("points") || q.includes("season") || q.includes("leads the") || q.includes("team") && q.includes("consistent")) categories.push("championship");
  if (q.includes("led") || q.includes("laps led") || q.includes("leader") || q.includes("dominated")) categories.push("lapsled");
  if (q.includes("win") || q.includes("won") || q.includes("result") || q.includes("finish") || q.includes("podium") || q.includes("improved") || q.includes("qualifying") || q.includes("start")) categories.push("results");
  if (q.includes("engine") || q.includes("manufacturer") || q.includes("honda") || q.includes("chevy") || q.includes("chevrolet")) categories.push("championship");

  if (categories.length === 0) categories.push("results", "lapsled");
  return [...new Set(categories)];
}

function isSeasonQuestion(question: string): boolean {
  const q = question.toLowerCase();
  return q.includes("season") || q.includes("championship") || q.includes("standings") || q.includes("year") ||
    q.includes("all races") || q.includes("this year") || q.includes("most consistent") ||
    q.includes("engine manufacturer") || q.includes("overall");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { question, raceId, year } = await req.json();
    if (!question || typeof question !== "string" || question.length > 500) {
      return new Response(JSON.stringify({ error: "Invalid question" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get race info
    let raceContext = "No specific race selected.";
    let currentRace: any = null;
    if (raceId) {
      const { data: race } = await supabase.from("races").select("*").eq("id", raceId).single();
      if (race) {
        currentRace = race;
        raceContext = `Race: ${race.event_name}, Round ${race.round_number}, ${race.track_name} (${race.track_type || "unknown"} track), ${race.race_date}, Year ${race.year}. Total laps: ${race.total_laps || "N/A"}. Lead changes: ${race.lead_changes || "N/A"}. Fastest lap: ${race.fastest_lap_driver || "N/A"} (#${race.fastest_lap_car || "N/A"}) at ${race.fastest_lap_speed || "N/A"} mph.`;
      }
    }

    const categories = classifyQuestion(question);
    const isSeason = isSeasonQuestion(question);
    const effectiveYear = year || currentRace?.year || 2026;
    const dataContext: Record<string, any> = {};

    // Query 1: Race results
    if (categories.includes("results") && raceId) {
      const { data } = await supabase
        .from("race_results")
        .select("car_number, driver_name, engine, finish_position, start_position, laps_completed, status, race_points, elapsed_time, time_gap, pit_stops")
        .eq("race_id", raceId)
        .order("finish_position")
        .limit(30);
      if (data?.length) dataContext.race_results = data;
    }

    // Query 2: Laps led
    if (categories.includes("lapsled")) {
      if (isSeason) {
        const { data: races } = await supabase.from("races").select("id").eq("year", effectiveYear).eq("status", "complete");
        if (races?.length) {
          const { data } = await supabase.from("laps_led").select("car_number, driver_name, laps_led, stints, longest_consecutive, race_id").in("race_id", races.map(r => r.id));
          if (data?.length) dataContext.season_laps_led = data;
        }
      } else if (raceId) {
        const { data } = await supabase.from("laps_led").select("car_number, driver_name, laps_led, stints, longest_consecutive").eq("race_id", raceId).order("laps_led", { ascending: false });
        if (data?.length) dataContext.race_laps_led = data;
      }
    }

    // Query 3: Pit stops
    if (categories.includes("pits") && raceId) {
      const { data: pitTimes } = await supabase
        .from("race_pit_times")
        .select("car_number, driver_name, lap_number, pit_time_seconds")
        .eq("race_id", raceId)
        .order("pit_time_seconds");
      if (pitTimes?.length) dataContext.pit_times = pitTimes;

      const { data: pitExec } = await supabase
        .from("pit_execution")
        .select("car_number, driver_name, best_transit_time, pit_lane_speed")
        .eq("race_id", raceId)
        .order("best_transit_time");
      if (pitExec?.length) dataContext.pit_execution = pitExec;
    }

    // Query 4: Section times
    if (categories.includes("sections") && raceId) {
      const { data } = await supabase
        .from("race_lap_sections")
        .select("car_number, driver_name, section_name, section_time, section_speed, lap_number, is_pit_lap")
        .eq("race_id", raceId)
        .eq("is_pit_lap", false)
        .limit(1000);
      if (data?.length) {
        // Aggregate: avg section time per driver per section
        const agg: Record<string, Record<string, { times: number[]; driver: string }>> = {};
        for (const row of data) {
          if (!row.section_time) continue;
          if (!agg[row.car_number]) agg[row.car_number] = {};
          if (!agg[row.car_number][row.section_name]) agg[row.car_number][row.section_name] = { times: [], driver: row.driver_name };
          agg[row.car_number][row.section_name].times.push(Number(row.section_time));
        }
        const summary: any[] = [];
        for (const [car, sections] of Object.entries(agg)) {
          const driverSections: any = { car_number: car };
          for (const [section, info] of Object.entries(sections)) {
            const avg = info.times.reduce((a, b) => a + b, 0) / info.times.length;
            driverSections[section] = { avg_time: +avg.toFixed(4), laps: info.times.length, driver: info.driver };
          }
          summary.push(driverSections);
        }
        dataContext.section_averages = summary.slice(0, 15);
      }
    }

    // Query 5: Lap time trends
    if (categories.includes("laptimes") && raceId) {
      const { data } = await supabase
        .from("race_lap_sections")
        .select("car_number, driver_name, lap_number, section_time, is_pit_lap")
        .eq("race_id", raceId)
        .eq("section_name", "Lap")
        .eq("is_pit_lap", false)
        .order("lap_number")
        .limit(1000);
      if (data?.length) {
        // Group by driver, show lap times
        const byDriver: Record<string, { driver: string; laps: { lap: number; time: number }[] }> = {};
        for (const row of data) {
          if (!row.section_time) continue;
          if (!byDriver[row.car_number]) byDriver[row.car_number] = { driver: row.driver_name, laps: [] };
          byDriver[row.car_number].laps.push({ lap: row.lap_number, time: Number(row.section_time) });
        }
        // Limit to top 10 drivers by number of laps
        const sorted = Object.entries(byDriver).sort((a, b) => b[1].laps.length - a[1].laps.length).slice(0, 10);
        dataContext.lap_times = Object.fromEntries(sorted.map(([car, d]) => [car, { driver: d.driver, laps: d.laps }]));
      }
    }

    // Query 6: Championship / season stats
    if (categories.includes("championship") || isSeason) {
      const { data: races } = await supabase.from("races").select("id, round_number, event_name").eq("year", effectiveYear).eq("status", "complete").order("round_number");
      if (races?.length) {
        const raceIds = races.map(r => r.id);
        const allResults: any[] = [];
        let from = 0;
        while (true) {
          const { data } = await supabase
            .from("race_results")
            .select("car_number, driver_name, engine, finish_position, start_position, race_points, status, laps_completed, race_id")
            .in("race_id", raceIds)
            .range(from, from + 999);
          if (data) allResults.push(...data);
          if (!data || data.length < 1000) break;
          from += 1000;
        }
        // Aggregate standings
        const standings: Record<string, any> = {};
        for (const r of allResults) {
          if (!standings[r.car_number]) {
            standings[r.car_number] = { car: r.car_number, driver: r.driver_name, engine: r.engine, totalPoints: 0, wins: 0, podiums: 0, top5: 0, races: 0, dnfs: 0 };
          }
          const s = standings[r.car_number];
          s.totalPoints += r.race_points;
          s.races++;
          if (r.finish_position === 1) s.wins++;
          if (r.finish_position <= 3) s.podiums++;
          if (r.finish_position <= 5) s.top5++;
          if (r.status !== "Running") s.dnfs++;
        }
        dataContext.championship_standings = Object.values(standings).sort((a: any, b: any) => b.totalPoints - a.totalPoints);

        // Season laps led
        const { data: lapsLed } = await supabase.from("laps_led").select("car_number, driver_name, laps_led").in("race_id", raceIds);
        if (lapsLed?.length) {
          const ledMap: Record<string, { driver: string; total: number }> = {};
          for (const l of lapsLed) {
            if (!ledMap[l.car_number]) ledMap[l.car_number] = { driver: l.driver_name || "", total: 0 };
            ledMap[l.car_number].total += l.laps_led;
          }
          dataContext.season_laps_led_summary = Object.entries(ledMap).map(([car, d]) => ({ car, ...d })).sort((a, b) => b.total - a.total).slice(0, 10);
        }
      }
    }

    // Build user message with context
    const contextStr = Object.keys(dataContext).length
      ? JSON.stringify(dataContext, null, 2)
      : "No detailed data available for this specific query.";

    const userMessage = `User question: ${question}

Race context: ${raceContext}

Relevant data:
${contextStr}

Please answer the fan's question using only the data provided above.`;

    // Call Lovable AI Gateway with streaming
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        stream: true,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(JSON.stringify({ error: "Unable to reach the AI right now. Please try again." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("race-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});