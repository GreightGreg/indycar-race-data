import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { extractText, getDocumentProxy } from "https://esm.sh/unpdf@0.12.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return new Response(JSON.stringify({ error: "No file provided" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const pdf = await getDocument(uint8Array);

    const pages: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const text = content.items.map((item: any) => item.str).join(" ");
      pages.push(text);
    }

    const page1 = await pdf.getPage(1);
    const page1Content = await page1.getTextContent();
    const page1Lines = extractLines(page1Content.items);

    const reportType = identifyReport(page1Lines);
    if (!reportType) {
      return new Response(JSON.stringify({ error: "Unknown report type", preview: page1Lines.slice(0, 6) }), {
        status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const eventInfo = parseEventInfo(page1Lines);
    const raceId = await getOrCreateRace(supabase, eventInfo);

    let result;
    switch (reportType) {
      case "race_results":
        result = await parseRaceResults(supabase, page1Lines, raceId, eventInfo);
        break;
      case "event_summary":
        result = await parseEventSummary(supabase, page1Lines, raceId);
        break;
      case "leader_laps":
        result = await parseLeaderLaps(supabase, pages, pdf, raceId);
        break;
      case "lap_chart":
        result = await parseLapChart(supabase, pages, pdf, raceId);
        break;
      case "pit_stops":
        result = await parsePitStops(supabase, pages, pdf, raceId);
        break;
      case "section_times_race":
        result = await parseSectionTimes(supabase, pages, pdf, raceId, "Race");
        break;
      case "section_times_p1":
        result = await parseSectionTimes(supabase, pages, pdf, raceId, "Practice 1");
        break;
      case "section_times_p2":
        result = await parseSectionTimes(supabase, pages, pdf, raceId, "Practice 2");
        break;
      case "section_times_pf":
        result = await parseSectionTimes(supabase, pages, pdf, raceId, "Practice Final");
        break;
      case "section_times_quals":
        result = await parseSectionTimes(supabase, pages, pdf, raceId, "Qualifying");
        break;
      case "results_p1":
        result = await parseSessionResults(supabase, page1Lines, raceId, "Practice 1");
        break;
      case "results_p2":
        result = await parseSessionResults(supabase, page1Lines, raceId, "Practice 2");
        break;
      case "results_pf":
        result = await parseSessionResults(supabase, page1Lines, raceId, "Practice Final");
        break;
      case "results_quals":
        result = await parseQualifyingResults(supabase, page1Lines, raceId);
        break;
      case "combined_practice":
        result = await parseCombinedPractice(supabase, page1Lines, raceId);
        break;
      case "quals_sectors":
        result = await parseQualifyingSectors(supabase, pages, pdf, raceId);
        break;
      default:
        result = { message: "Report type recognized but not yet parsed", type: reportType };
    }

    await updateRaceStatus(supabase, raceId);

    return new Response(JSON.stringify({ success: true, reportType, raceId, ...result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message, stack: err.stack }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});

function extractLines(items: any[]): string[] {
  const lineMap: Map<number, string[]> = new Map();
  for (const item of items) {
    const y = Math.round(item.transform[5]);
    if (!lineMap.has(y)) lineMap.set(y, []);
    lineMap.get(y)!.push(item.str);
  }
  return Array.from(lineMap.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([, words]) => words.join(" ").replace(/\s+/g, " ").trim())
    .filter(l => l.length > 0);
}

async function getPageLines(pdf: any, pageNum: number): Promise<string[]> {
  const page = await pdf.getPage(pageNum);
  const content = await page.getTextContent();
  return extractLines(content.items);
}

function identifyReport(lines: string[]): string | null {
  const reportLine = lines.find(l => l.includes("Report:")) || "";
  const sessionLine = lines.find(l => l.includes("Session:")) || "";
  if (reportLine.includes("Official Lap Report")) return "race_results";
  if (reportLine.includes("Event Summary")) return "event_summary";
  if (reportLine.includes("Leader Lap Summary")) return "leader_laps";
  if (reportLine.includes("Race Lap Chart")) return "lap_chart";
  if (reportLine.includes("Pit Stop Summary")) return "pit_stops";
  if (reportLine.includes("Top Section Times")) {
    if (sessionLine.includes("Practice 1")) return "section_times_p1";
    if (sessionLine.includes("Practice 2")) return "section_times_p2";
    if (sessionLine.includes("Practice Final")) return "section_times_pf";
    if (sessionLine.includes("Qualifications")) return "section_times_quals";
    if (sessionLine.includes("Race")) return "section_times_race";
  }
  if (reportLine.includes("Results of Session")) {
    if (sessionLine.includes("Practice 1")) return "results_p1";
    if (sessionLine.includes("Practice 2")) return "results_p2";
    if (sessionLine.includes("Practice Final")) return "results_pf";
  }
  if (reportLine.includes("Official Results of Session") && sessionLine.includes("Qualifications")) return "results_quals";
  if (reportLine.includes("Combined Results of Practice")) return "combined_practice";
  if (reportLine.includes("Section Data Report") && sessionLine.includes("Qualifications")) return "quals_sectors";
  return null;
}

function parseEventInfo(lines: string[]) {
  const eventLine = lines.find(l => l.startsWith("Event:")) || "";
  const trackLine = lines.find(l => l.startsWith("Track:")) || "";
  const sessionLine = lines.find(l => l.startsWith("Session:")) || "";
  const eventMatch = eventLine.match(/Event:\s+(.+?)\s+Round\s+(\d+)/);
  const eventName = eventMatch ? eventMatch[1].trim() : eventLine.replace("Event:", "").trim();
  const roundNumber = eventMatch ? parseInt(eventMatch[2]) : 0;
  const trackMatch = trackLine.match(/Track:\s+(.+?)\s+[\d.]+\s+mile/);
  const trackName = trackMatch ? trackMatch[1].trim() : trackLine.replace("Track:", "").trim();
  const dateMatch = sessionLine.match(/(\w+ \d+,\s*\d{4})/);
  const sessionDate = dateMatch ? dateMatch[1] : "";
  const year = dateMatch ? parseInt(dateMatch[1].split(",")[1].trim()) : new Date().getFullYear();
  return { eventName, roundNumber, trackName, sessionDate, year };
}

async function getOrCreateRace(supabase: any, eventInfo: any): Promise<string> {
  const { data: existing } = await supabase
    .from("races")
    .select("id")
    .eq("round_number", eventInfo.roundNumber)
    .eq("season_year", eventInfo.year)
    .single();
  if (existing) return existing.id;
  const { data: newRace, error } = await supabase
    .from("races")
    .insert({
      event_name: eventInfo.eventName,
      track_name: eventInfo.trackName,
      round_number: eventInfo.roundNumber,
      season_year: eventInfo.year,
      year: eventInfo.year,
      race_date: eventInfo.sessionDate,
      status: "pending",
      files_received: []
    })
    .select("id")
    .single();
  if (error) throw new Error(`Failed to create race: ${error.message}`);
  return newRace.id;
}

async function updateRaceStatus(supabase: any, raceId: string) {
  const coreFiles = ["race_results", "event_summary", "leader_laps", "lap_chart", "pit_stops", "section_times_race"];
  const { data: race } = await supabase.from("races").select("files_received").eq("id", raceId).single();
  if (!race) return;
  const received = race.files_received || [];
  const allCoreReceived = coreFiles.every(f => received.includes(f));
  await supabase.from("races").update({ status: allCoreReceived ? "complete" : "pending" }).eq("id", raceId);
}

async function markFileReceived(supabase: any, raceId: string, fileType: string) {
  const { data: race } = await supabase.from("races").select("files_received").eq("id", raceId).single();
  const received = race?.files_received || [];
  if (!received.includes(fileType)) {
    await supabase.from("races").update({ files_received: [...received, fileType] }).eq("id", raceId);
  }
}

function parseEngine(cet: string): string {
  if (!cet) return "Unknown";
  const parts = cet.split("/");
  return parts.length >= 2 ? (parts[1] === "C" ? "Chevy" : parts[1] === "H" ? "Honda" : "Unknown") : "Unknown";
}

async function parseRaceResults(supabase: any, lines: string[], raceId: string, eventInfo: any) {
  await supabase.from("race_results").delete().eq("race_id", raceId);
  const headerLine = lines.find(l => l.includes("Time of Race:")) || "";
  const totalLapsMatch = headerLine.match(/End of Lap (\d+)/);
  const timeMatch = headerLine.match(/Time of Race:\s+([\d:\.]+)/);
  const avgSpdMatch = headerLine.match(/Avg Speed:\s+([\d\.]+)/);
  const leadChangesMatch = headerLine.match(/Lead Changes:\s+(\d+)/);
  const cautionLapsMatch = headerLine.match(/Caution Laps:\s+(\d+)/);
  const fastestLapLine = lines.find(l => l.includes("Fastest Lap:")) || "";
  const fastestSpdMatch = fastestLapLine.match(/Fastest Lap:\s+([\d\.]+)\s+mph/);
  const fastestTimeMatch = fastestLapLine.match(/\(\s*([\d\.]+)\s+sec\)/);
  const fastestLapNumMatch = fastestLapLine.match(/on lap\s+(\d+)/);
  const fastestCarMatch = fastestLapLine.match(/by\s+(\d+)\s+-\s+(.+)/);
  await supabase.from("races").update({
    total_laps: totalLapsMatch ? parseInt(totalLapsMatch[1]) : null,
    race_time: timeMatch ? timeMatch[1] : null,
    avg_speed: avgSpdMatch ? parseFloat(avgSpdMatch[1]) : null,
    lead_changes: leadChangesMatch ? parseInt(leadChangesMatch[1]) : null,
    caution_laps: cautionLapsMatch ? parseInt(cautionLapsMatch[1]) : null,
    fastest_lap_speed: fastestSpdMatch ? parseFloat(fastestSpdMatch[1]) : null,
    fastest_lap_time: fastestTimeMatch ? fastestTimeMatch[1] : null,
    fastest_lap_number: fastestLapNumMatch ? parseInt(fastestLapNumMatch[1]) : null,
    fastest_lap_car: fastestCarMatch ? fastestCarMatch[1] : null,
    fastest_lap_driver: fastestCarMatch ? fastestCarMatch[2].trim() : null,
  }).eq("id", raceId);

  const results = [];
  const cautions = [];
  const penalties = [];
  let inResults = false;
  let inCautions = false;
  let inPenalties = false;

  for (const line of lines) {
    if (line.includes("Pos SP Car Driver")) { inResults = true; continue; }
    if (line.includes("Lead Change Summary")) { inResults = false; inCautions = true; continue; }
    if (line.includes("Penalty Summary")) { inCautions = false; inPenalties = true; continue; }
    if (line.includes("(C)hassis:")) break;
    if (inResults) {
      const m = line.match(/^(\d+)\s+(\d+)\s+(\d+)\s+(.+?)\s+(D\/[CH]\/F)\s+(\d+)\s+(\d+)\s+([\d\-\.]+)\s+(\d+)\s+([\d:\.]+)\s+([\d\.]+)\s+(\w+)\s+(\d+)\s+(\d+)\s+(\d+)/);
      if (m) {
        results.push({
          race_id: raceId,
          finish_position: parseInt(m[1]),
          start_position: parseInt(m[2]),
          car_number: m[3],
          driver_name: m[4].trim(),
          engine: parseEngine(m[5]),
          laps_completed: parseInt(m[6]),
          laps_down: parseInt(m[7]),
          time_gap: m[8],
          pit_stops: parseInt(m[9]),
          elapsed_time: m[10],
          avg_speed: parseFloat(m[11]),
          status: m[12],
          race_points: parseInt(m[13]),
          total_points: parseInt(m[14]),
          championship_rank: parseInt(m[15])
        });
      }
    }
    if (inCautions) {
      const m = line.match(/^(\d+)\s+(\d+)\s+to\s+(\d+)\s+(\d+)\s+(.+)/);
      if (m) {
        cautions.push({
          race_id: raceId,
          caution_number: parseInt(m[1]),
          start_lap: parseInt(m[2]),
          end_lap: parseInt(m[3]),
          total_laps: parseInt(m[4]),
          reason: m[5].trim()
        });
      }
    }
    if (inPenalties) {
      const m = line.match(/^(\d+)\s+(.+?)\s+(\d+)\s+(.+)/);
      if (m) {
        penalties.push({
          race_id: raceId,
          car_number: m[1],
          reason: m[2].trim(),
          lap_number: parseInt(m[3]),
          penalty: m[4].trim()
        });
      }
    }
  }

  if (results.length > 0) await supabase.from("race_results").insert(results);
  if (cautions.length > 0) {
    await supabase.from("cautions").delete().eq("race_id", raceId);
    await supabase.from("cautions").insert(cautions);
  }
  if (penalties.length > 0) {
    await supabase.from("penalties").delete().eq("race_id", raceId);
    await supabase.from("penalties").insert(penalties);
  }
  await markFileReceived(supabase, raceId, "race_results");
  return { drivers: results.length, cautions: cautions.length, penalties: penalties.length };
}

async function parseEventSummary(supabase: any, lines: string[], raceId: string) {
  const stats: any = {};
  for (const line of lines) {
    const lapStats = line.match(/Total Laps:\s+(\d+)\s+Green Laps:\s+(\d+)\s+Caution Laps:\s+(\d+)/);
    if (lapStats) { stats.total_laps = parseInt(lapStats[1]); stats.green_laps = parseInt(lapStats[2]); stats.caution_laps = parseInt(lapStats[3]); }
    const raceStats = line.match(/Time:\s+([\d:]+)\s+Avg Spd:\s+([\d\.]+)/);
    if (raceStats) { stats.race_time = raceStats[1]; stats.avg_speed = parseFloat(raceStats[2]); }
    const leadChanges = line.match(/Lead Changes:\s+(\d+)\s+among\s+(\d+)/);
    if (leadChanges) { stats.lead_changes = parseInt(leadChanges[1]); stats.drivers_led = parseInt(leadChanges[2]); }
    const improved = line.match(/Most Improved:\s+(\d+)\s+-\s+(.+)/);
    if (improved) { stats.most_improved_car = improved[1]; stats.most_improved_driver = improved[2].trim(); }
    const passes = line.match(/Total Passes:\s+(\d+)\s+Position Passes:\s+(\d+)/);
    if (passes) { stats.total_passes = parseInt(passes[1]); stats.position_passes = parseInt(passes[2]); }
  }
  await supabase.from("races").update(stats).eq("id", raceId);
  await markFileReceived(supabase, raceId, "event_summary");
  return { stats };
}

async function parseLeaderLaps(supabase: any, pages: string[], pdf: any, raceId: string) {
  await supabase.from("race_laps").delete().eq("race_id", raceId);
  const laps = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const lines = await getPageLines(pdf, p);
    for (const line of lines) {
      const m = line.match(/^(\d+)\s+(\d+)\s+(.+?)\s+(D\/[CH]\/F)\s+([\d:\.]+)\s+([\d\.]+)\s+([\d:\.]+)\s+(\w+)/);
      if (m) {
        laps.push({
          race_id: raceId,
          lap_number: parseInt(m[1]),
          car_number: m[2],
          driver_name: m[3].trim(),
          lap_time: m[5],
          lap_speed: parseFloat(m[6]),
          gap_to_leader: m[7],
          flag_status: m[8]
        });
      }
    }
  }
  if (laps.length > 0) await supabase.from("race_laps").insert(laps);
  await markFileReceived(supabase, raceId, "leader_laps");
  return { laps: laps.length };
}

async function parseLapChart(supabase: any, pages: string[], pdf: any, raceId: string) {
  await supabase.from("race_positions").delete().eq("race_id", raceId);
  const carPositions: Record<string, Record<number, number>> = {};

  for (let p = 1; p <= pdf.numPages; p++) {
    const lines = await getPageLines(pdf, p);
    const lapHeaderLine = lines.find(l => l.includes("Lap->"));
    if (!lapHeaderLine) continue;
    const lapNumbers = lapHeaderLine.replace(/.*Lap->\s*/, "").trim().split(/\s+/).map(Number).filter(n => !isNaN(n));
    for (const line of lines) {
      const m = line.match(/^(\d+)\s+-\s+.+?\s+\(\d+\)\s+\d+\s+(.+)/);
      if (!m) continue;
      const carNumber = m[1];
      if (!carPositions[carNumber]) carPositions[carNumber] = {};
      const posValues = m[2].trim().split(/\s+/).map(Number).filter(n => !isNaN(n));
      lapNumbers.forEach((lap, idx) => {
        if (posValues[idx] !== undefined) carPositions[carNumber][lap] = idx + 1;
      });
    }
  }

  const insertRows: any[] = [];
  for (const [carNumber, lapMap] of Object.entries(carPositions)) {
    for (const [lap, pos] of Object.entries(lapMap)) {
      insertRows.push({ race_id: raceId, lap_number: parseInt(lap), car_number: carNumber, position: pos });
    }
  }
  if (insertRows.length > 0) {
    for (let i = 0; i < insertRows.length; i += 500) {
      await supabase.from("race_positions").insert(insertRows.slice(i, i + 500));
    }
  }
  await markFileReceived(supabase, raceId, "lap_chart");
  return { positions: insertRows.length };
}

async function parsePitStops(supabase: any, pages: string[], pdf: any, raceId: string) {
  await supabase.from("pit_stops").delete().eq("race_id", raceId);
  const stops: any[] = [];
  let currentCar = "";
  let currentDriver = "";

  for (let p = 1; p <= pdf.numPages; p++) {
    const lines = await getPageLines(pdf, p);
    for (const line of lines) {
      const driverM = line.match(/^(\d+)\s+(\d+)\s+(.+?)\s+(D\/[CH]\/F)\s+(\d+)\s+Pit Stop/);
      if (driverM) { currentCar = driverM[2]; currentDriver = driverM[3].trim(); continue; }
      if (currentCar) {
        const stopM = line.match(/^(\d+)\s+(\d+)\s+(\d+)\s+([\d:\.]+)/);
        if (stopM) {
          stops.push({
            race_id: raceId,
            car_number: currentCar,
            driver_name: currentDriver,
            stop_number: parseInt(stopM[1]),
            lap_number: parseInt(stopM[2]),
            race_lap: parseInt(stopM[3]),
            time_of_race: stopM[4]
          });
        }
      }
    }
  }
  if (stops.length > 0) await supabase.from("pit_stops").insert(stops);
  await markFileReceived(supabase, raceId, "pit_stops");
  return { stops: stops.length };
}

async function parseSectionTimes(supabase: any, pages: string[], pdf: any, raceId: string, sessionType: string) {
  await supabase.from("fastest_laps").delete().eq("race_id", raceId).eq("session_type", sessionType);
  const rows: any[] = [];

  for (let p = 1; p <= pdf.numPages; p++) {
    const lines = await getPageLines(pdf, p);
    const sectionLine = lines.find(l => l.includes("Section:")) || "";
    const sectionMatch = sectionLine.match(/Section:\s+(.+?)\s+Length:/);
    const sectionName = sectionMatch ? sectionMatch[1].trim() : `Section ${p}`;
    const lengthMatch = sectionLine.match(/Length:\s+([\d\.]+)/);
    const sectionLength = lengthMatch ? parseFloat(lengthMatch[1]) : null;

    for (const line of lines) {
      const m = line.match(/^(\d+)\s+(\d+)\s+(.+?)\s+(D\/[CH]\/F)\s+([\d:\.]+)\s+([\d\.]+)\s+(\d+)/);
      if (m) {
        rows.push({
          race_id: raceId,
          session_type: sessionType,
          section_name: sectionName,
          section_length_miles: sectionLength,
          rank: parseInt(m[1]),
          car_number: m[2],
          driver_name: m[3].trim(),
          section_time: m[5],
          section_speed: parseFloat(m[6]),
          lap_number: parseInt(m[7])
        });
      }
    }
  }

  if (rows.length > 0) {
    for (let i = 0; i < rows.length; i += 500) {
      await supabase.from("fastest_laps").insert(rows.slice(i, i + 500));
    }
  }
  const fileKey = sessionType === "Race" ? "section_times_race" : `section_times_${sessionType.toLowerCase().replace(" ", "_")}`;
  await markFileReceived(supabase, raceId, fileKey);
  return { rows: rows.length, sections: pdf.numPages };
}

async function parseSessionResults(supabase: any, lines: string[], raceId: string, sessionType: string) {
  await supabase.from("session_full_results").delete().eq("race_id", raceId).eq("session_type", sessionType);
  const results: any[] = [];
  let inData = false;

  for (const line of lines) {
    if (line.includes("Rank Car Driver")) { inData = true; continue; }
    if (line.includes("(C)hassis:")) break;
    if (!inData) continue;
    const m = line.match(/^(\d+)\s+(\d+)\s+(.+?)\s+(D\/[CH]\/F)\s+([\d:\.]+)\s+([\d\.]+)\s+([\d\-\.]+)\s+([\d\-\.]+)\s+(\d+)\s+(\d+)/);
    if (m) {
      results.push({
        race_id: raceId,
        session_type: sessionType,
        rank: parseInt(m[1]),
        car_number: m[2],
        driver_name: m[3].trim(),
        engine: parseEngine(m[4]),
        best_time: m[5],
        best_speed: parseFloat(m[6]),
        diff_to_leader: m[7] === "--.----" ? null : m[7],
        gap_to_ahead: m[8] === "--.----" ? null : m[8],
        best_lap_number: parseInt(m[9]),
        total_laps: parseInt(m[10])
      });
    }
  }
  if (results.length > 0) await supabase.from("session_full_results").insert(results);
  return { drivers: results.length };
}

async function parseQualifyingResults(supabase: any, lines: string[], raceId: string) {
  await supabase.from("qualifying_results").delete().eq("race_id", raceId);
  const results: any[] = [];
  let inData = false;

  for (const line of lines) {
    if (line.includes("Rank Car Driver")) { inData = true; continue; }
    if (line.includes("(C)hassis:")) break;
    if (!inData) continue;
    const m = line.match(/^(\d+)\s+(\d+)\s+(.+?)\s+(D\/[CH]\/F)\s+([\d\.]+)\s+([\d\.]+)\s+([\d:\.]+)\s+([\d\.]+)/);
    if (m) {
      const l1 = parseFloat(m[5]);
      const l2 = parseFloat(m[6]);
      results.push({ race_id: raceId, qual_position: parseInt(m[1]), car_number: m[2], driver_name: m[3].trim(), engine: parseEngine(m[4]), lap1_time: m[5], lap2_time: m[6], total_time: m[7], avg_speed: parseFloat(m[8]), best_lap_time: String(Math.min(l1, l2)), comment: null });
      continue;
    }
    const dnqM = line.match(/^(\d+)\s+(\d+)\s+(.+?)\s+(D\/[CH]\/F)\s+([\d\.]+)\s+DNQ/);
    if (dnqM) {
      results.push({ race_id: raceId, qual_position: parseInt(dnqM[1]), car_number: dnqM[2], driver_name: dnqM[3].trim(), engine: parseEngine(dnqM[4]), lap1_time: dnqM[5], lap2_time: null, total_time: null, avg_speed: null, best_lap_time: dnqM[5], comment: "DNQ" });
      continue;
    }
    const noTimeM = line.match(/^(\d+)\s+(\d+)\s+(.+?)\s+(D\/[CH]\/F)\s+No Time/);
    if (noTimeM) {
      results.push({ race_id: raceId, qual_position: parseInt(noTimeM[1]), car_number: noTimeM[2], driver_name: noTimeM[3].trim(), engine: parseEngine(noTimeM[4]), lap1_time: null, lap2_time: null, total_time: null, avg_speed: null, best_lap_time: null, comment: "DNQ" });
    }
  }
  if (results.length > 0) await supabase.from("qualifying_results").insert(results);
  return { drivers: results.length };
}

async function parseCombinedPractice(supabase: any, lines: string[], raceId: string) {
  await supabase.from("combined_practice_results").delete().eq("race_id", raceId);
  const results: any[] = [];
  let inData = false;

  for (const line of lines) {
    if (line.includes("Rank Car Driver")) { inData = true; continue; }
    if (line.includes("(C)hassis:")) break;
    if (!inData) continue;
    const m = line.match(/^(\d+)\s+(\d+)\s+(.+?)\s+(D\/[CH]\/F)\s+(Practice \d+|Practice Final)\s+([\d:\.]+)\s+([\d\.]+)\s+(\d+)/);
    if (m) {
      results.push({ race_id: raceId, rank: parseInt(m[1]), car_number: m[2], driver_name: m[3].trim(), engine: parseEngine(m[4]), best_session: m[5], best_time: m[6], best_speed: parseFloat(m[7]), total_laps: parseInt(m[8]) });
    }
  }
  if (results.length > 0) await supabase.from("combined_practice_results").insert(results);
  return { drivers: results.length };
}

async function parseQualifyingSectors(supabase: any, pages: string[], pdf: any, raceId: string) {
  await supabase.from("qualifying_sectors").delete().eq("race_id", raceId);
  const sectorNames = ["dogleg", "front_stretch", "turn1_entry", "turn1_exit", "turn2_entry", "turn2_exit", "turn3_entry", "turn3_exit", "turn4", "full_lap"];
  const rows: any[] = [];

  for (let p = 1; p <= pdf.numPages; p++) {
    const lines = await getPageLines(pdf, p);
    const driverLine = lines.find(l => l.includes("Section Data for Car"));
    if (!driverLine) continue;
    const driverM = driverLine.match(/Section Data for Car (\d+)\s+-\s+(.+)/);
    if (!driverM) continue;
    const carNumber = driverM[1];
    const driverName = driverM[2].trim();

    let lap1Times: number[] = [];
    let lap1Speeds: number[] = [];
    let lap2Times: number[] = [];
    let lap2Speeds: number[] = [];
    let currentLap = 0;
    let expectingSpeed = false;

    for (const line of lines) {
      if (line.trim() === "1") { currentLap = 1; expectingSpeed = false; continue; }
      if (line.trim() === "2") { currentLap = 2; expectingSpeed = false; continue; }
      const tMatch = line.match(/^T\s+([\d\s\.]+)/);
      if (tMatch && currentLap > 0) {
        const vals = tMatch[1].trim().split(/\s+/).map(Number).filter(n => !isNaN(n));
        if (currentLap === 1) lap1Times = vals; else lap2Times = vals;
        expectingSpeed = true;
        continue;
      }
      const sMatch = line.match(/^S\s+([\d\s\.]+)/);
      if (sMatch && currentLap > 0 && expectingSpeed) {
        const vals = sMatch[1].trim().split(/\s+/).map(Number).filter(n => !isNaN(n));
        if (currentLap === 1) lap1Speeds = vals; else lap2Speeds = vals;
        expectingSpeed = false;
      }
    }

    if (lap1Times.length >= 9) {
      const row: any = { race_id: raceId, car_number: carNumber, driver_name: driverName, lap_number: 1 };
      sectorNames.forEach((name, i) => { row[`${name}_time`] = lap1Times[i] ?? null; row[`${name}_speed`] = lap1Speeds[i] ?? null; });
      rows.push(row);
    }
    if (lap2Times.length >= 9) {
      const row: any = { race_id: raceId, car_number: carNumber, driver_name: driverName, lap_number: 2 };
      sectorNames.forEach((name, i) => { row[`${name}_time`] = lap2Times[i] ?? null; row[`${name}_speed`] = lap2Speeds[i] ?? null; });
      rows.push(row);
    }
  }

  if (rows.length > 0) await supabase.from("qualifying_sectors").insert(rows);
  return { drivers: rows.length };
}