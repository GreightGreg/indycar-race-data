import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { extractText, getDocumentProxy } from "https://esm.sh/unpdf@0.12.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PARSE_BATCH_SIZE = 20;
const CONTINUATION_REPORT_TYPES = new Set(["leader_laps", "lap_chart"]);

type BatchedParseOptions = {
  startPage: number;
  endPage: number;
  clearExisting: boolean;
  isFinalBatch: boolean;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");

    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return new Response(JSON.stringify({ error: "No file provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const pdf = await getDocumentProxy(uint8Array);

    const page1 = await pdf.getPage(1);
    const page1Content = await page1.getTextContent();
    const page1Lines = extractLines(page1Content.items);

    console.log("Page 1 lines (first 15):", JSON.stringify(page1Lines.slice(0, 15)));
    const reportType = identifyReport(page1Lines);
    console.log("Identified report type:", reportType);
    if (!reportType) {
      return new Response(JSON.stringify({ error: "Unknown report type", preview: page1Lines.slice(0, 15) }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (reportType === "unsupported_section_data") {
      return new Response(
        JSON.stringify({
          success: true,
          skipped: true,
          reportType,
          message: "Section Data Report for non-qualifying session skipped intentionally",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const eventInfo = parseEventInfo(page1Lines);
    console.log("Calling getOrCreateRace...");
    const raceId = await getOrCreateRace(supabase, eventInfo);
    console.log("Got raceId:", raceId, "— now parsing", reportType);

    const batchOptions = CONTINUATION_REPORT_TYPES.has(reportType)
      ? getBatchedParseOptions(formData, pdf.numPages)
      : null;

    if (batchOptions) {
      console.log(
        `Processing ${reportType} pages ${batchOptions.startPage}-${batchOptions.endPage} of ${pdf.numPages} (clearExisting: ${batchOptions.clearExisting})`,
      );
    }

    let result;
    switch (reportType) {
      case "race_results":
        result = await parseRaceResults(supabase, pdf, raceId, eventInfo);
        break;
      case "event_summary":
        result = await parseEventSummary(supabase, pdf, page1Lines, raceId);
        break;
      case "leader_laps":
        result = await parseLeaderLaps(supabase, pdf, raceId, batchOptions!);
        break;
      case "lap_chart":
        result = await parseLapChart(supabase, pdf, raceId, batchOptions!);
        break;
      case "pit_stops":
        result = await parsePitStops(supabase, pdf, raceId);
        break;
      case "section_times_race":
        result = await parseSectionTimes(supabase, pdf, raceId, "Race");
        break;
      case "section_times_p1":
        result = await parseSectionTimes(supabase, pdf, raceId, "Practice 1");
        break;
      case "section_times_p2":
        result = await parseSectionTimes(supabase, pdf, raceId, "Practice 2");
        break;
      case "section_times_pf":
        result = await parseSectionTimes(supabase, pdf, raceId, "Practice Final");
        break;
      case "section_times_quals": {
        const qualSessionType = getQualifyingSectionSessionType(page1Lines);
        result = await parseSectionTimes(supabase, pdf, raceId, qualSessionType);
        break;
      }
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
      case "results_quals_group1":
        result = await parseSessionResults(supabase, page1Lines, raceId, "Qualifying Group 1");
        break;
      case "results_quals_group2":
        result = await parseSessionResults(supabase, page1Lines, raceId, "Qualifying Group 2");
        break;
      case "results_quals_round2":
        result = await parseSessionResults(supabase, page1Lines, raceId, "Qualifying Round 2 (Fast 12)");
        break;
      case "results_quals_round3":
        result = await parseSessionResults(supabase, page1Lines, raceId, "Qualifying Round 3 (Fast 6)");
        break;
      case "results_quals_combined":
        result = await parseSessionResults(supabase, page1Lines, raceId, "Qualifying Combined");
        break;
      case "combined_practice":
        result = await parseCombinedPractice(supabase, page1Lines, raceId);
        break;
      case "quals_sectors":
        result = await parseQualifyingSectors(supabase, pdf, raceId);
        break;
      case "section_data_race":
        return new Response(JSON.stringify({ success: true, skipped: true, message: "Section Data Race reports are no longer processed." }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      default:
        result = { message: "Report type recognized but not yet parsed", type: reportType };
    }

    const hasMore = Boolean(batchOptions && !batchOptions.isFinalBatch);
    if (!hasMore) {
      await updateRaceStatus(supabase, raceId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        reportType,
        raceId,
        ...result,
        ...(batchOptions
          ? {
              hasMore,
              nextPage: hasMore ? batchOptions.endPage + 1 : null,
              processedPageRange: {
                startPage: batchOptions.startPage,
                endPage: batchOptions.endPage,
                totalPages: pdf.numPages,
              },
            }
          : {}),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error("Parse error:", err.message, err.stack);
    return new Response(JSON.stringify({ error: err.message, stack: err.stack }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
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
    .filter((l) => l.length > 0);
}

async function getPageLines(pdf: any, pageNum: number): Promise<string[]> {
  const page = await pdf.getPage(pageNum);
  const content = await page.getTextContent();
  return extractLines(content.items);
}

function parseIntegerFormValue(value: FormDataEntryValue | null, fallback: number): number {
  if (typeof value !== "string") return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseBooleanFormValue(value: FormDataEntryValue | null, fallback = false): boolean {
  if (typeof value !== "string") return fallback;
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

function getBatchedParseOptions(formData: FormData, totalPages: number): BatchedParseOptions {
  const requestedStartPage = parseIntegerFormValue(formData.get("startPage"), 1);
  const startPage = Math.min(Math.max(requestedStartPage, 1), totalPages);
  const endPage = Math.min(startPage + PARSE_BATCH_SIZE - 1, totalPages);
  const clearExisting = parseBooleanFormValue(formData.get("clearExisting"), startPage === 1);

  return {
    startPage,
    endPage,
    clearExisting,
    isFinalBatch: endPage >= totalPages,
  };
}

function normalizeHeaderLine(line: string): string {
  return line
    .replace(/\b([A-Za-z])\s+([A-Za-z]{2,})\b/g, "$1$2")
    .replace(/\s+/g, " ")
    .trim();
}

function getQualifyingSectionSessionType(lines: string[]): string {
  const normalizedLines = lines.map(normalizeHeaderLine);
  const sessionLine = normalizedLines.find((l) => l.includes("Session:")) || "";
  if (sessionLine.includes("Group 1")) return "Qualifying Group 1";
  if (sessionLine.includes("Group 2")) return "Qualifying Group 2";
  if (
    sessionLine.includes("Round 2") ||
    sessionLine.includes("Fast 12") ||
    sessionLine.includes("Segment 2") ||
    sessionLine.includes("Top 12")
  )
    return "Qualifying Round 2 (Fast 12)";
  if (sessionLine.includes("Round 3") || sessionLine.includes("Fast 6") || sessionLine.includes("Segment 3"))
    return "Qualifying Round 3 (Fast 6)";
  return "Qualifying";
}

function identifyReport(lines: string[]): string | null {
  const normalizedLines = lines.map(normalizeHeaderLine);
  const reportLine = normalizedLines.find((l) => l.includes("Report:")) || "";
  const sessionLine = normalizedLines.find((l) => l.includes("Session:")) || "";
  if (
    reportLine.includes("Official Lap Report") ||
    reportLine.includes("Unofficial Lap Report") ||
    reportLine.includes("Official Final Results")
  )
    return "race_results";
  if (reportLine.includes("Event Summary")) return "event_summary";
  if (reportLine.includes("Leader Lap Summary")) return "leader_laps";
  if (reportLine.includes("Race Lap Chart")) return "lap_chart";
  if (reportLine.includes("Pit Stop Summary")) return "pit_stops";
  if (reportLine.includes("Top Section Times")) {
    if (sessionLine.includes("Practice 1")) return "section_times_p1";
    if (sessionLine.includes("Practice 2")) return "section_times_p2";
    if (sessionLine.includes("Practice Final") || sessionLine.includes("Warm-up")) return "section_times_pf";
    if (sessionLine.includes("Qualifications")) return "section_times_quals";
    if (sessionLine.includes("Race")) return "section_times_race";
  }
  // Must check "Official Results of Session" BEFORE generic "Results of Session"
  if (reportLine.includes("Official Results of Session") && sessionLine.includes("Qualifications")) {
    const hasCombinedSessionColumn = normalizedLines.some((l) => l.includes("Time Speed Session"));
    return hasCombinedSessionColumn ? "results_quals_combined" : "results_quals";
  }
  if (reportLine.includes("Results of Session")) {
    if (sessionLine.includes("Practice 1")) return "results_p1";
    if (sessionLine.includes("Practice 2")) return "results_p2";
    if (sessionLine.includes("Practice Final") || sessionLine.includes("Warm-up")) return "results_pf";
    // Road/street course qualifying rounds
    if (sessionLine.includes("Qualifications") && sessionLine.includes("Group 1")) return "results_quals_group1";
    if (sessionLine.includes("Qualifications") && sessionLine.includes("Group 2")) return "results_quals_group2";
    if (
      sessionLine.includes("Qualifications") &&
      (sessionLine.includes("Round 2") ||
        sessionLine.includes("Fast 12") ||
        sessionLine.includes("Segment 2") ||
        sessionLine.includes("Top 12"))
    )
      return "results_quals_round2";
    if (
      sessionLine.includes("Qualifications") &&
      (sessionLine.includes("Round 3") || sessionLine.includes("Fast 6") || sessionLine.includes("Segment 3"))
    )
      return "results_quals_round3";
    // Generic qualifying session results (e.g. combined starting order)
    if (sessionLine.includes("Qualifications")) return "results_quals_combined";
  }
  if (reportLine.includes("Combined Qualifying Results") || reportLine.includes("Starting Line-Up"))
    return "results_quals_combined";
  if (reportLine.includes("Combined Results of Practice")) return "combined_practice";
  if (reportLine.includes("Section Data Report")) {
    return "unsupported_section_data";
  }
  return null;
}

function parseEventInfo(lines: string[]) {
  const normalizedLines = lines.map(normalizeHeaderLine);
  const eventLine = normalizedLines.find((l) => l.includes("Event:")) || "";
  const trackLine = normalizedLines.find((l) => l.includes("Track:")) || "";
  const sessionLine = normalizedLines.find((l) => l.includes("Session:")) || "";

  // Search ALL lines for Round number — it may be on a different line than "Event:"
  let eventName = "";
  let roundNumber = 0;

  // First, find round number from any line
  for (const l of normalizedLines) {
    const rm = l.match(/Round\s+(\d+)/i);
    if (rm) {
      roundNumber = parseInt(rm[1]);
      break;
    }
  }

  // Try "value Event: Round N" format first (unpdf extracts value before label)
  const beforeEventMatch = eventLine.match(/^(.+?)\s+Event:\s*Round\s+(\d+)/);
  if (beforeEventMatch) {
    eventName = beforeEventMatch[1].trim();
  } else {
    // Try "Event: value Round N" or "Event: value"
    const afterEventMatch = eventLine.match(/Event:\s*(.+?)(?:\s+Round\s+\d+)?$/);
    if (afterEventMatch && afterEventMatch[1].trim() && afterEventMatch[1].trim() !== "Round") {
      eventName = afterEventMatch[1].replace(/Round\s+\d+/, "").trim();
    }
  }

  // If eventName is still empty, check the first line for the event title (before "Event:" or "Round")
  if (!eventName) {
    const firstLine = normalizedLines[0] || "";
    eventName = firstLine
      .replace(/Event:.*/, "")
      .replace(/Round\s+\d+/, "")
      .trim();
  }

  // Format: "Phoenix Raceway Track: 1 mile(s)" — track name is BEFORE "Track:"
  let trackName = "";
  const beforeTrackMatch = trackLine.match(/^(.+?)\s+Track:\s*[\d.]+\s+mile/);
  if (beforeTrackMatch) {
    trackName = beforeTrackMatch[1].trim();
  } else {
    const afterTrackMatch = trackLine.match(/Track:\s*(.+?)\s+[\d.]+\s+mile/);
    trackName = afterTrackMatch ? afterTrackMatch[1].trim() : trackLine.replace(/Track:/, "").trim();
  }

  // Extract track length
  const trackLengthMatch = trackLine.match(/([\d.]+)\s+mile/);
  const trackLengthMiles = trackLengthMatch ? parseFloat(trackLengthMatch[1]) : null;

  // Format: "March 7, 2026 Session: Race" — date is BEFORE "Session:"
  const dateMatch = normalizedLines.join(" ").match(/(\w+ \d+,\s*\d{4})/);
  const rawDate = dateMatch ? dateMatch[1] : "";
  const year = dateMatch ? parseInt(dateMatch[1].split(",")[1].trim()) : new Date().getFullYear();

  // Convert "March 13, 2026" → "2026-03-13" ISO format for PostgreSQL
  let sessionDate = rawDate;
  if (rawDate) {
    try {
      const d = new Date(rawDate);
      if (!isNaN(d.getTime())) {
        sessionDate = d.toISOString().split("T")[0];
      }
    } catch {
      /* keep raw string */
    }
  }

  console.log(
    "Parsed event info:",
    JSON.stringify({ eventName, roundNumber, trackName, trackLengthMiles, sessionDate, year }),
  );
  return { eventName, roundNumber, trackName, trackLengthMiles, sessionDate, year };
}

async function getOrCreateRace(supabase: any, eventInfo: any): Promise<string> {
  console.log(
    "getOrCreateRace called with:",
    JSON.stringify({ round: eventInfo.roundNumber, year: eventInfo.year, track: eventInfo.trackName }),
  );

  // Try matching on round_number + year first (skip if round is 0)
  if (eventInfo.roundNumber > 0) {
    const { data: existing, error: e1 } = await supabase
      .from("races")
      .select("id")
      .eq("round_number", eventInfo.roundNumber)
      .eq("year", eventInfo.year)
      .maybeSingle();
    if (e1) console.error("Lookup error (round+year):", e1.message);
    if (existing) {
      console.log("Found existing race by round+year:", existing.id);
      return existing.id;
    }

    const { data: existing2, error: e2 } = await supabase
      .from("races")
      .select("id")
      .eq("round_number", eventInfo.roundNumber)
      .eq("season_year", eventInfo.year)
      .maybeSingle();
    if (e2) console.error("Lookup error (round+season_year):", e2.message);
    if (existing2) {
      console.log("Found existing race by round+season_year:", existing2.id);
      return existing2.id;
    }
  }

  // Try matching by track name + year (for event summary where round may be 0)
  if (eventInfo.trackName) {
    const { data: byTrack, error: e3 } = await supabase
      .from("races")
      .select("id")
      .eq("year", eventInfo.year)
      .ilike("track_name", `%${eventInfo.trackName.split(" ")[0]}%`)
      .maybeSingle();
    if (e3) console.error("Lookup error (track):", e3.message);
    if (byTrack) {
      console.log("Found existing race by track:", byTrack.id);
      return byTrack.id;
    }
  }

  console.log("Creating new race for round", eventInfo.roundNumber, "date:", eventInfo.sessionDate);
  const { data: newRace, error } = await supabase
    .from("races")
    .insert({
      event_name: eventInfo.eventName,
      track_name: eventInfo.trackName,
      track_length_miles: eventInfo.trackLengthMiles,
      round_number: eventInfo.roundNumber,
      season_year: eventInfo.year,
      year: eventInfo.year,
      race_date: eventInfo.sessionDate,
      status: "pending",
      files_received: [],
    })
    .select("id")
    .single();
  if (error) {
    console.error("Failed to create race:", error.message, error.details, error.hint);
    throw new Error(`Failed to create race: ${error.message}`);
  }
  console.log("Created new race:", newRace.id);
  return newRace.id;
}

async function updateRaceStatus(supabase: any, raceId: string) {
  const coreFiles = ["race_results", "event_summary", "leader_laps", "lap_chart", "pit_stops", "section_times_race"];
  const { data: race } = await supabase.from("races").select("files_received").eq("id", raceId).single();
  if (!race) return;
  const received = race.files_received || [];
  const allCoreReceived = coreFiles.every((f) => received.includes(f));
  await supabase
    .from("races")
    .update({ status: allCoreReceived ? "complete" : "pending" })
    .eq("id", raceId);
}

async function markFileReceived(supabase: any, raceId: string, fileType: string) {
  const { data: race } = await supabase.from("races").select("files_received").eq("id", raceId).single();
  const received = race?.files_received || [];
  if (!received.includes(fileType)) {
    await supabase
      .from("races")
      .update({ files_received: [...received, fileType] })
      .eq("id", raceId);
  }
}

async function replaceRows(
  supabase: any,
  table: string,
  filters: Record<string, string>,
  rows: any[],
  options: { allowEmpty?: boolean; chunkSize?: number } = {},
) {
  const { allowEmpty = false, chunkSize = 500 } = options;

  if (!allowEmpty && rows.length === 0) {
    return false;
  }

  let deleteQuery = supabase.from(table).delete();
  for (const [column, value] of Object.entries(filters)) {
    deleteQuery = deleteQuery.eq(column, value);
  }
  const { error: deleteError } = await deleteQuery;
  if (deleteError) throw new Error(`Failed clearing ${table}: ${deleteError.message}`);

  if (rows.length > 0) {
    for (let i = 0; i < rows.length; i += chunkSize) {
      const batch = rows.slice(i, i + chunkSize);
      const { error: insertError } = await supabase.from(table).insert(batch);
      if (insertError) throw new Error(`Failed inserting ${table}: ${insertError.message}`);
    }
  }

  return true;
}

function parseEngine(cet: string): string {
  if (!cet) return "Unknown";
  const parts = cet.split("/");
  return parts.length >= 2 ? (parts[1] === "C" ? "Chevy" : parts[1] === "H" ? "Honda" : "Unknown") : "Unknown";
}

function parseRacePointColumns(pointTokens: string[], roundNumber: number) {
  if (pointTokens.length < 2) {
    const value = pointTokens.length === 1 ? parseInt(pointTokens[0], 10) || 0 : 0;
    return { racePoints: value, totalPoints: value };
  }

  if (roundNumber === 1 && pointTokens.length % 2 === 0 && pointTokens.every((token) => /^\d$/.test(token))) {
    const mid = pointTokens.length / 2;
    const left = pointTokens.slice(0, mid).join("");
    const right = pointTokens.slice(mid).join("");
    if (left === right) {
      const combined = parseInt(left, 10) || 0;
      return { racePoints: combined, totalPoints: combined };
    }
  }

  if (
    roundNumber === 1 &&
    pointTokens.length === 2 &&
    pointTokens.every((token) => /^\d$/.test(token)) &&
    parseInt(pointTokens[1], 10) < parseInt(pointTokens[0], 10)
  ) {
    const combined = parseInt(pointTokens.join(""), 10) || 0;
    return { racePoints: combined, totalPoints: combined };
  }

  let best: { racePoints: number; totalPoints: number; score: number } | null = null;

  for (let split = 1; split < pointTokens.length; split++) {
    const racePoints = parseInt(pointTokens.slice(0, split).join(""), 10);
    const totalPoints = parseInt(pointTokens.slice(split).join(""), 10);
    if (!Number.isFinite(racePoints) || !Number.isFinite(totalPoints)) continue;

    let score = 0;
    if (racePoints > 100) score += 1000;
    if (totalPoints > 500) score += 1000;
    if (totalPoints < racePoints) score += 250;
    if (roundNumber === 1) score += Math.abs(totalPoints - racePoints) * 20;
    score += Math.abs(split - pointTokens.length / 2);

    if (!best || score < best.score) best = { racePoints, totalPoints, score };
  }

  return best
    ? { racePoints: best.racePoints, totalPoints: best.totalPoints }
    : {
        racePoints: parseInt(pointTokens[0], 10) || 0,
        totalPoints: parseInt(pointTokens.slice(1).join(""), 10) || 0,
      };
}

function normalizeRaceResultTimeGap(tokens: string[]): string {
  if (tokens.length === 0) return "--.----";

  const candidates = tokens.filter(
    (token) =>
      /^--\.----$/.test(token) ||
      /^-+$/.test(token) ||
      /^\d+-$/.test(token) ||
      /^\d{1,2}:\d{2}\.\d+$/.test(token) ||
      /^\d+\.\d+$/.test(token),
  );

  if (candidates.length > 0) {
    return candidates[candidates.length - 1];
  }

  return tokens[tokens.length - 1];
}

function isRaceResultRowStart(line: string): boolean {
  return /^\d+\s+\d+\s+\d+\s+/.test(line.trim());
}

function trimEmbeddedRaceResultRow(line: string): string {
  const normalized = line.replace(/\s+/g, " ").trim();
  const matches = Array.from(normalized.matchAll(/\b\d+\s+\d+\s+\d+\s+[A-Za-z]/g));

  if (matches.length > 1) {
    const secondMatchIndex = matches[1].index ?? normalized.length;
    return normalized.slice(0, secondMatchIndex).trim();
  }

  return normalized;
}

function parseRaceResultLine(line: string, roundNumber: number) {
  const normalizedLine = trimEmbeddedRaceResultRow(line);
  const tokens = normalizedLine.split(/\s+/);
  if (tokens.length < 15) return null;

  const engineIndex = tokens.findIndex((token, index) => index >= 3 && /^D\/[CH]\/F$/.test(token));
  if (engineIndex === -1) return null;

  const finishPosition = parseInt(tokens[0], 10);
  const startPosition = parseInt(tokens[1], 10);
  const carNumber = tokens[2];
  const driverName = tokens.slice(3, engineIndex).join(" ").trim();
  const engine = parseEngine(tokens[engineIndex]);

  const baseTokens = tokens.slice(engineIndex + 1);
  if (baseTokens.length < 8) return null;

  const lapsCompleted = parseInt(baseTokens[0], 10);
  const lapsDown = parseInt(baseTokens[1], 10);
  if (!Number.isFinite(lapsCompleted) || !Number.isFinite(lapsDown)) return null;

  const elapsedIndex = baseTokens.findIndex((token) => /^(\d{2}:){2}\d{2}\.\d+$/.test(token));
  if (elapsedIndex < 4 || elapsedIndex >= baseTokens.length - 1) return null;

  const pitStopToken = baseTokens[elapsedIndex - 1];
  const pitStops = parseInt(pitStopToken, 10);
  const elapsedTime = baseTokens[elapsedIndex];
  const avgSpeed = parseFloat(baseTokens[elapsedIndex + 1]);
  const timeGap = normalizeRaceResultTimeGap(baseTokens.slice(2, elapsedIndex - 1));
  const tailTokens = baseTokens.slice(elapsedIndex + 2);
  if (!tailTokens.length || !/^\d+$/.test(tailTokens[tailTokens.length - 1])) return null;

  let championshipRank = parseInt(tailTokens[tailTokens.length - 1], 10);
  const tailWithoutRank = tailTokens.slice(0, -1);

  let pointsStartIndex = tailWithoutRank.length;
  while (pointsStartIndex > 0 && /^\d+$/.test(tailWithoutRank[pointsStartIndex - 1])) {
    pointsStartIndex -= 1;
  }

  const statusTokens = tailWithoutRank.slice(0, pointsStartIndex);
  const pointTokens = tailWithoutRank.slice(pointsStartIndex);
  if (!pointTokens.length) return null;

  if (
    roundNumber === 1 &&
    pointTokens.length === 3 &&
    pointTokens.every((token) => /^\d+$/.test(token)) &&
    pointTokens[0] === pointTokens[1] &&
    parseInt(pointTokens[2], 10) === finishPosition
  ) {
    championshipRank = finishPosition;
    pointTokens.pop();
  }

  const { racePoints, totalPoints } = parseRacePointColumns(pointTokens, roundNumber);

  return {
    finish_position: finishPosition,
    start_position: startPosition,
    car_number: carNumber,
    driver_name: driverName,
    engine,
    laps_completed: Number.isFinite(lapsCompleted) ? lapsCompleted : 0,
    laps_down: Number.isFinite(lapsDown) ? lapsDown : 0,
    time_gap: timeGap,
    pit_stops: Number.isFinite(pitStops) ? pitStops : 0,
    elapsed_time: elapsedTime,
    avg_speed: Number.isFinite(avgSpeed) ? avgSpeed : 0,
    status: statusTokens.join(" ").trim() || "Running",
    race_points: racePoints,
    total_points: totalPoints,
    championship_rank: championshipRank,
  };
}

async function parseRaceResults(supabase: any, pdf: any, raceId: string, eventInfo: any) {
  const allLines: string[] = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const pageLines = await getPageLines(pdf, p);
    allLines.push(...pageLines);
  }

  const headerLine = allLines.find((l) => l.includes("Time of Race:")) || "";
  const totalLapsMatch = headerLine.match(/End of Lap (\d+)/);
  const timeMatch = headerLine.match(/Time of Race:\s+([\d:\.]+)/);
  const avgSpdMatch = headerLine.match(/Avg Speed:\s+([\d\.]+)/);
  const leadChangesMatch = headerLine.match(/Lead Changes:\s+(\d+)/);
  const cautionLapsMatch = headerLine.match(/Caution Laps:\s+(\d+)/);
  const fastestLapLine = allLines.find((l) => l.includes("Fastest Lap:")) || "";
  const fastestSpdMatch = fastestLapLine.match(/Fastest Lap:\s+([\d\.]+)\s+mph/);
  const fastestTimeMatch = fastestLapLine.match(/\(\s*([\d\.]+)\s+sec\)/);
  const fastestLapNumMatch = fastestLapLine.match(/on lap\s+(\d+)/);
  const fastestCarMatch = fastestLapLine.match(/by\s+(\d+)\s+-\s+(.+)/);
  const bestLeadLine = allLines.find((l) => l.includes("Fastest Leader Lap:")) || "";
  const bestLeadSpdMatch = bestLeadLine.match(/Fastest Leader Lap:\s+([\d\.]+)\s+mph/);
  const bestLeadTimeMatch = bestLeadLine.match(/\(\s*([\d\.]+)\s+sec\)/);
  const bestLeadDriverMatch = bestLeadLine.match(/by\s+(\d+)\s+-\s+(.+)/);
  await supabase
    .from("races")
    .update({
      total_laps: totalLapsMatch ? parseInt(totalLapsMatch[1]) : null,
      total_race_time: timeMatch ? timeMatch[1] : null,
      avg_speed: avgSpdMatch ? parseFloat(avgSpdMatch[1]) : null,
      lead_changes: leadChangesMatch ? parseInt(leadChangesMatch[1]) : null,
      caution_laps: cautionLapsMatch ? parseInt(cautionLapsMatch[1]) : null,
      fastest_lap_speed: fastestSpdMatch ? parseFloat(fastestSpdMatch[1]) : null,
      fastest_lap_time: fastestTimeMatch ? fastestTimeMatch[1] : null,
      fastest_lap_number: fastestLapNumMatch ? parseInt(fastestLapNumMatch[1]) : null,
      fastest_lap_car: fastestCarMatch ? fastestCarMatch[1] : null,
      fastest_lap_driver: fastestCarMatch ? fastestCarMatch[2].trim() : null,
      best_lead_lap_speed: bestLeadSpdMatch ? parseFloat(bestLeadSpdMatch[1]) : null,
      best_lead_lap_time: bestLeadTimeMatch ? bestLeadTimeMatch[1] : null,
      best_lead_lap_driver: bestLeadDriverMatch ? bestLeadDriverMatch[2].trim() : null,
    })
    .eq("id", raceId);

  const results = [];
  const cautions = [];
  const penalties = [];
  const postResultsLines: string[] = [];
  let section = "header";
  let sawCautionSection = false;
  let sawPenaltySection = false;
  let pendingResultLine = "";
  const cautionLapCount = cautionLapsMatch ? parseInt(cautionLapsMatch[1]) : null;

  const flushPendingResultLine = () => {
    if (!pendingResultLine) return;
    const parsedRow = parseRaceResultLine(pendingResultLine.replace(/\s+/g, " ").trim(), eventInfo?.roundNumber || 0);
    if (parsedRow) {
      results.push({ race_id: raceId, ...parsedRow });
    } else {
      console.warn("Failed to parse race result row:", pendingResultLine);
    }
    pendingResultLine = "";
  };

  for (const line of allLines) {
    if (line.includes("Pos SP Car Driver") || line.includes("Laps Time Pit")) {
      flushPendingResultLine();
      section = "results";
      continue;
    }
    if (line.includes("Lead Change Summary") || line.includes("LeadChange")) {
      flushPendingResultLine();
      section = "postresults";
      continue;
    }
    if (section !== "postresults" && (/caution\s*flag/i.test(line) || /caution\s*summary/i.test(line))) {
      flushPendingResultLine();
      section = "cautions";
      sawCautionSection = true;
      continue;
    }
    if (section !== "postresults" && /penalty\s*summary/i.test(line)) {
      flushPendingResultLine();
      section = "penalties";
      sawPenaltySection = true;
      continue;
    }
    if (line.includes("(C)hassis:") || line.includes("Legend:")) {
      flushPendingResultLine();
      section = "done";
      continue;
    }
    if (section === "done") break;

    if (section === "results") {
      if (isRaceResultRowStart(line)) {
        flushPendingResultLine();
        pendingResultLine = line;
      } else if (pendingResultLine) {
        pendingResultLine = `${pendingResultLine} ${line}`;
      }
      continue;
    }
    // Collect post-results, caution, and penalty sections for downstream parsing.
    // Some PDFs put Penalty Summary after switching sections, so we must keep reading there too.
    if (section === "postresults" || section === "cautions" || section === "penalties") {
      postResultsLines.push(line);
      if (/Caution\s*Summary/i.test(line) || /Caution\s*Flag/i.test(line)) sawCautionSection = true;
      if (/Penalty\s*Summary/i.test(line)) sawPenaltySection = true;
      continue;
    }
  }

  // Parse cautions and penalties from collected post-results lines
  // unpdf can interleave lead-change rows with caution/penalty fragments, so we parse these separately.
  let pendingCautionReason = "";
  let inPenaltySection = false;
  const penaltyFragments: string[] = [];
  const actionPattern =
    /(Restart at the Back of Field|Drive-Through|Stop\s*&\s*Hold(?:\s*-\s*[^$]+)?|Warning(?:\s*-\s*[^$]+)?|Penalty(?:\s*-\s*[^$]+)?|Loss\s+of\s+[^$]+)$/i;
  const leadChangeRowPattern = /^\d+\s+\d{1,3}\s+.+,\s+.+\s+\d{1,3}\s+.+,\s+.+(?:\s+\d+)?$/;

  for (const rawLine of postResultsLines) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    if (/^Penalty\s*Summary/i.test(trimmed)) {
      inPenaltySection = true;
      sawPenaltySection = true;
      continue;
    }

    if (!inPenaltySection) {
      if (/^(Lead Change Summary|Caution Summary|Caution Flag Summary|Car\s+Reason|On Lap)/i.test(trimmed)) {
        continue;
      }

      if (/^[A-Z]/.test(trimmed) && !/^\d/.test(trimmed)) {
        pendingCautionReason = trimmed;
        continue;
      }

      const cautionM = trimmed.match(/\b(\d{1,2})\s+(\d+)\s+to\s+(\d+)\s+(\d+)\b/);
      if (cautionM && parseInt(cautionM[1]) <= 20 && parseInt(cautionM[2]) > 0) {
        sawCautionSection = true;
        cautions.push({
          race_id: raceId,
          caution_number: parseInt(cautionM[1]),
          start_lap: parseInt(cautionM[2]),
          end_lap: parseInt(cautionM[3]),
          laps: parseInt(cautionM[3]) - parseInt(cautionM[2]) + 1,
          total_laps: parseInt(cautionM[4]),
          reason: pendingCautionReason || "Unknown",
        });
        pendingCautionReason = "";
      }
      continue;
    }

    if (/^(Car\s+Reason\s+Lap\s+Penalty|On Lap|Lead Change Summary)$/i.test(trimmed)) continue;
    if (leadChangeRowPattern.test(trimmed)) continue;
    penaltyFragments.push(trimmed);
  }

  let pendingPenaltyReason = "";
  let pendingPenaltyAction = "";
  let lastPenaltyIndex = -1;

  for (const fragment of penaltyFragments) {
    const inlinePenalty = fragment.match(
      /^\s*(\d{1,3})\s+(.+?)\s+(\d{1,3})\s+(Restart at the Back of Field|Drive-Through|Stop\s*&\s*Hold.*|Warning.*|Penalty.*|Loss\s+of.*)$/i,
    );
    if (inlinePenalty) {
      penalties.push({
        race_id: raceId,
        car_number: inlinePenalty[1],
        reason: inlinePenalty[2].trim(),
        lap_number: parseInt(inlinePenalty[3]),
        penalty: inlinePenalty[4].trim(),
      });
      lastPenaltyIndex = penalties.length - 1;
      pendingPenaltyReason = "";
      pendingPenaltyAction = "";
      continue;
    }

    const numericPenalty = fragment.match(/^(\d{1,3})\s+(\d{1,3})$/);
    if (numericPenalty && (pendingPenaltyReason || pendingPenaltyAction)) {
      penalties.push({
        race_id: raceId,
        car_number: numericPenalty[1],
        reason: pendingPenaltyReason.trim() || "Unknown",
        lap_number: parseInt(numericPenalty[2]),
        penalty: pendingPenaltyAction.trim() || null,
      });
      lastPenaltyIndex = penalties.length - 1;
      pendingPenaltyReason = "";
      pendingPenaltyAction = "";
      continue;
    }

    const actionMatch = fragment.match(
      /^(.*?)(Restart at the Back of Field|Drive-Through|Stop\s*&\s*Hold.*|Warning.*|Penalty.*|Loss\s+of.*)$/i,
    );
    if (actionMatch) {
      pendingPenaltyReason = [pendingPenaltyReason, actionMatch[1].trim()]
        .filter(Boolean)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      pendingPenaltyAction = actionMatch[2].trim();
      continue;
    }

    if (lastPenaltyIndex >= 0) {
      penalties[lastPenaltyIndex].reason = `${penalties[lastPenaltyIndex].reason} ${fragment}`
        .replace(/\s+/g, " ")
        .trim();
      continue;
    }

    pendingPenaltyReason = [pendingPenaltyReason, fragment].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
  }

  flushPendingResultLine();

  if (results.length === 0) {
    throw new Error("No race result rows parsed; existing race results were preserved");
  }

  // Derive championship totals/ranks from cumulative race points rather than
  // trusting PDF standing columns, which can split digits incorrectly.
  const roundNumber = eventInfo?.roundNumber || 0;
  const seasonYear = eventInfo?.year || new Date().getFullYear();

  if (roundNumber === 1) {
    for (const r of results) {
      r.total_points = Number(r.race_points) || 0;
    }
  } else if (roundNumber > 1) {
    const { data: priorRaces, error: priorRacesError } = await supabase
      .from("races")
      .select("id")
      .eq("year", seasonYear)
      .lt("round_number", roundNumber)
      .order("round_number", { ascending: true });

    if (priorRacesError) {
      throw new Error(`Failed loading prior races for championship totals: ${priorRacesError.message}`);
    }

    const priorRaceIds = (priorRaces || []).map((race: any) => race.id).filter((id: string) => id !== raceId);
    const priorTotals: Record<string, number> = {};

    if (priorRaceIds.length > 0) {
      const { data: priorResults, error: priorResultsError } = await supabase
        .from("race_results")
        .select("car_number, race_points")
        .in("race_id", priorRaceIds);

      if (priorResultsError) {
        throw new Error(`Failed loading prior race points: ${priorResultsError.message}`);
      }

      for (const row of priorResults || []) {
        const carNumber = String(row.car_number || "");
        const racePoints = Number(row.race_points) || 0;
        priorTotals[carNumber] = (priorTotals[carNumber] || 0) + racePoints;
      }
    }

    for (const r of results) {
      const carNumber = String(r.car_number || "");
      r.total_points = (priorTotals[carNumber] || 0) + (Number(r.race_points) || 0);
    }
  }

  const sorted = [...results].sort((a, b) => {
    if (b.total_points !== a.total_points) return b.total_points - a.total_points;
    if (b.race_points !== a.race_points) return b.race_points - a.race_points;
    if (a.finish_position !== b.finish_position) return a.finish_position - b.finish_position;
    return String(a.car_number).localeCompare(String(b.car_number), undefined, { numeric: true });
  });

  sorted.forEach((r, i) => {
    r.championship_rank = i + 1;
  });

  await replaceRows(supabase, "race_results", { race_id: raceId }, results);

  console.log("Post-results lines for caution/penalty debug:", JSON.stringify(postResultsLines));
  console.log(
    "Saw caution section:",
    sawCautionSection,
    "cautions parsed:",
    cautions.length,
    "caution laps from header:",
    cautionLapCount,
  );

  if (sawCautionSection && (cautions.length > 0 || cautionLapCount === 0)) {
    await replaceRows(supabase, "cautions", { race_id: raceId }, cautions, { allowEmpty: true });
  } else if (cautionLapCount && cautionLapCount > 0 && cautions.length === 0) {
    console.warn(
      `Caution section detected in summary but no caution rows parsed for race ${raceId}; preserving existing cautions`,
    );
  }

  if (sawPenaltySection && penalties.length > 0) {
    await replaceRows(supabase, "penalties", { race_id: raceId }, penalties);
  } else if (sawPenaltySection && penalties.length === 0) {
    console.warn(
      `Penalty section detected but no penalty rows parsed for race ${raceId}; preserving existing penalties`,
    );
  }

  await markFileReceived(supabase, raceId, "race_results");
  console.log(
    `Parsed race results: ${results.length} drivers, ${cautions.length} cautions, ${penalties.length} penalties`,
  );
  return { drivers: results.length, cautions: cautions.length, penalties: penalties.length };
}

async function parseEventSummary(supabase: any, pdf: any, page1Lines: string[], raceId: string) {
  // Extract track map image from event summary PDF
  try {
    const page1ForImg = await pdf.getPage(1);
    const ops = await page1ForImg.getOperatorList();

    const imageNames: string[] = [];
    for (let i = 0; i < ops.fnArray.length; i++) {
      if (ops.fnArray[i] === 85 || ops.fnArray[i] === 82 || ops.fnArray[i] === 83) {
        if (ops.argsArray[i]) imageNames.push(ops.argsArray[i][0]);
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 500));

    if (imageNames.length >= 2) {
      const trackMapObj = await new Promise<any>((resolve) => {
        page1ForImg.objs.get(imageNames[1], resolve);
      });

      if (trackMapObj && trackMapObj.width > 500 && trackMapObj.width > trackMapObj.height) {
        const { width, height, data } = trackMapObj;

        function uint32BE(n: number): Uint8Array {
          return new Uint8Array([(n >> 24) & 0xff, (n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff]);
        }

        function crc32(buf: Uint8Array): number {
          const table = new Int32Array(256);
          for (let i = 0; i < 256; i++) {
            let c = i;
            for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
            table[i] = c;
          }
          let crc = -1;
          for (const b of buf) crc = table[(crc ^ b) & 0xff] ^ (crc >>> 8);
          return ~crc >>> 0;
        }

        function pngChunk(type: string, chunkData: Uint8Array): Uint8Array {
          const t = new TextEncoder().encode(type);
          const len = uint32BE(chunkData.length);
          const combined = new Uint8Array(t.length + chunkData.length);
          combined.set(t);
          combined.set(chunkData, t.length);
          const crcVal = uint32BE(crc32(combined));
          const result = new Uint8Array(4 + 4 + chunkData.length + 4);
          result.set(len, 0);
          result.set(t, 4);
          result.set(chunkData, 8);
          result.set(crcVal, 8 + chunkData.length);
          return result;
        }

        const ihdr = new Uint8Array(13);
        const ihdrView = new DataView(ihdr.buffer);
        ihdrView.setUint32(0, width);
        ihdrView.setUint32(4, height);
        ihdr[8] = 8;
        ihdr[9] = 2;

        const srcData = new Uint8Array(data);
        const raw = new Uint8Array(height * (width * 3 + 1));
        for (let y = 0; y < height; y++) {
          raw[y * (width * 3 + 1)] = 0;
          raw.set(srcData.subarray(y * width * 3, (y + 1) * width * 3), y * (width * 3 + 1) + 1);
        }

        const { deflate } = await import("https://deno.land/x/compress@v0.4.5/mod.ts");
        const compressed = deflate(raw);

        const sig = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
        const iend = new Uint8Array(0);
        const chunks = [sig, pngChunk("IHDR", ihdr), pngChunk("IDAT", compressed), pngChunk("IEND", iend)];
        const totalLen = chunks.reduce((s, c) => s + c.length, 0);
        const png = new Uint8Array(totalLen);
        let offset = 0;
        for (const chunk of chunks) {
          png.set(chunk, offset);
          offset += chunk.length;
        }

        const storageClient = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        );

        const filename = `${raceId}.png`;
        const { error: uploadError } = await storageClient.storage.from("track-maps").upload(filename, png, {
          contentType: "image/png",
          upsert: true,
        });

        if (!uploadError) {
          const { data: urlData } = storageClient.storage.from("track-maps").getPublicUrl(filename);

          await supabase.from("races").update({ track_map_url: urlData.publicUrl }).eq("id", raceId);

          console.log(`Track map extracted and stored: ${urlData.publicUrl}`);
        } else {
          console.error("Track map upload error:", uploadError.message);
        }
      }
    }
  } catch (e: any) {
    console.error("Track map extraction failed (non-fatal):", e.message);
  }

  // Collect all lines from all pages
  const allLines = [...page1Lines];
  for (let p = 2; p <= pdf.numPages; p++) {
    const pageLines = await getPageLines(pdf, p);
    allLines.push(...pageLines);
  }

  const stats: any = {};
  for (const line of allLines) {
    const lapStats = line.match(/Total Laps:\s+(\d+)\s+Green Laps:\s+(\d+)\s+Caution Laps:\s+(\d+)/);
    if (lapStats) {
      stats.total_laps = parseInt(lapStats[1]);
      stats.green_laps = parseInt(lapStats[2]);
      stats.caution_laps = parseInt(lapStats[3]);
    }
    const raceStats = line.match(/Time:\s+([\d:]+)\s+Avg Spd:\s+([\d\.]+)/);
    if (raceStats) {
      stats.race_time = raceStats[1];
      stats.avg_speed = parseFloat(raceStats[2]);
    }
    const leadChanges = line.match(/Lead Changes:\s+(\d+)\s+among\s+(\d+)/);
    if (leadChanges) {
      stats.lead_changes = parseInt(leadChanges[1]);
      stats.drivers_who_led = parseInt(leadChanges[2]);
    }
    const improved = line.match(/Most Improved:\s+(\d+)\s+-\s+(.+)/);
    if (improved) {
      stats.most_improved_car = improved[1];
      stats.most_improved_driver = improved[2].trim();
    }
    const improvedPos = line.match(/Improved\s+(\d+)\s+positions/i);
    if (improvedPos) {
      stats.most_improved_positions = parseInt(improvedPos[1]);
    }
    const passes = line.match(/Total Passes:\s+(\d+)\s+Position Passes:\s+(\d+)/);
    if (passes) {
      stats.total_passes = parseInt(passes[1]);
      stats.position_passes = parseInt(passes[2]);
    }
  }
  await supabase.from("races").update(stats).eq("id", raceId);

  // Parse Laps Led section
  // Format: "# Driver Laps Stints Start-End" e.g. "12 Malukas, David 45 3 1-20 50-60"
  // Or: "Car # Driver # Laps Led # Times Led Longest Sequence Start End"
  await supabase.from("laps_led").delete().eq("race_id", raceId);
  const lapsLedEntries: any[] = [];
  let inLapsLed = false;
  for (const line of allLines) {
    if (line.includes("Laps Led") && (line.includes("Times Led") || line.includes("Longest"))) {
      inLapsLed = true;
      continue;
    }
    // Stop if we hit a different section header
    if (
      inLapsLed &&
      (line.includes("Caution Flag Summary") ||
        line.includes("Penalty Summary") ||
        line.includes("Top Section") ||
        line.includes("Event:"))
    ) {
      inLapsLed = false;
      continue;
    }
    if (inLapsLed) {
      // Try: car_number driver_name laps_led times_led longest_seq start_lap end_lap
      const m = line.match(/^\s*(\d+)\s+(.+?)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s*$/);
      if (m) {
        lapsLedEntries.push({
          race_id: raceId,
          car_number: m[1],
          driver_name: m[2].trim(),
          laps_led: parseInt(m[3]),
          stints: parseInt(m[4]),
          longest_consecutive: parseInt(m[5]),
          start_lap_of_longest: parseInt(m[6]),
        });
        continue;
      }
      // Simpler format: car_number driver_name laps_led times_led longest start end (may have extra cols)
      const m2 = line.match(/^\s*(\d+)\s+(.+?)\s+(\d+)\s+(\d+)\s+(\d+)/);
      if (m2 && parseInt(m2[3]) > 0) {
        lapsLedEntries.push({
          race_id: raceId,
          car_number: m2[1],
          driver_name: m2[2].trim(),
          laps_led: parseInt(m2[3]),
          stints: parseInt(m2[4]),
          longest_consecutive: parseInt(m2[5]),
        });
      }
    }
  }
  if (lapsLedEntries.length > 0) {
    await supabase.from("laps_led").insert(lapsLedEntries);
  }
  console.log("Parsed laps led:", lapsLedEntries.length, "entries");

  await markFileReceived(supabase, raceId, "event_summary");
  return { stats, lapsLed: lapsLedEntries.length };
}

async function parseLeaderLaps(supabase: any, pdf: any, raceId: string, options: BatchedParseOptions) {
  const { startPage, endPage, clearExisting, isFinalBatch } = options;
  const laps: any[] = [];
  let didClearExisting = false;

  for (let p = startPage; p <= endPage; p++) {
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
          flag_status: m[8],
        });
      }
    }
  }

  if (laps.length > 0) {
    if (clearExisting) {
      await supabase.from("race_laps").delete().eq("race_id", raceId);
      didClearExisting = true;
    }
    for (let i = 0; i < laps.length; i += 500) {
      const chunk = laps.slice(i, i + 500);
      const { error } = await supabase.from("race_laps").insert(chunk);
      if (error) throw new Error(`Failed inserting leader laps: ${error.message}`);
    }
  }

  console.log(
    `Leader laps batch pages ${startPage}-${endPage}: ${laps.length} rows${didClearExisting ? " (cleared existing)" : ""}`,
  );

  if (!isFinalBatch) {
    return { laps: laps.length, didClearExisting };
  }

  if (laps.length === 0 && clearExisting) {
    throw new Error("No leader lap rows parsed; existing lap data was preserved");
  }

  const { count, error } = await supabase.from("race_laps").select("*", { head: true, count: "exact" }).eq("race_id", raceId);
  if (error) throw new Error(`Failed counting leader laps: ${error.message}`);
  if (!count) throw new Error("No leader lap rows parsed; existing lap data was preserved");

  await markFileReceived(supabase, raceId, "leader_laps");
  return { laps: count, didClearExisting };
}

async function parseLapChart(supabase: any, pdf: any, raceId: string, options: BatchedParseOptions) {
  const { startPage, endPage, clearExisting, isFinalBatch } = options;
  const carPositions: Record<string, Record<number, number>> = {};
  let didClearExisting = false;

  for (let p = startPage; p <= endPage; p++) {
    const lines = await getPageLines(pdf, p);

    let lapNumbers: number[] = [];
    const numberOnlyLines = lines.filter((l) => /^[\d\s]+$/.test(l.trim()) && l.trim().split(/\s+/).length > 5);
    for (const nl of numberOnlyLines) {
      const nums = nl.trim().split(/\s+/).map(Number);
      let isSequential = true;
      for (let i = 1; i < Math.min(nums.length, 10); i++) {
        if (nums[i] <= nums[i - 1]) {
          isSequential = false;
          break;
        }
      }
      if (isSequential && nums.length > 5) {
        lapNumbers = nums;
        break;
      }
    }
    if (lapNumbers.length === 0) continue;

    for (const line of lines) {
      const m = line.match(/^(\d+)\s+-\s+.+?\s+\(\d+\)\s+(\d+)\s+(.+)/);
      if (!m) continue;
      const rowPosition = parseInt(m[2]);
      const cellValues = m[3].trim().split(/\s+/);
      lapNumbers.forEach((lap, idx) => {
        const carNum = cellValues[idx];
        if (carNum && !isNaN(parseInt(carNum))) {
          if (!carPositions[carNum]) carPositions[carNum] = {};
          carPositions[carNum][lap] = rowPosition;
        }
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
    if (clearExisting) {
      await supabase.from("race_positions").delete().eq("race_id", raceId);
      didClearExisting = true;
    }
    for (let i = 0; i < insertRows.length; i += 500) {
      const chunk = insertRows.slice(i, i + 500);
      const { error } = await supabase.from("race_positions").insert(chunk);
      if (error) throw new Error(`Failed inserting lap chart: ${error.message}`);
    }
  }

  console.log(
    `Lap chart batch pages ${startPage}-${endPage}: ${insertRows.length} rows${didClearExisting ? " (cleared existing)" : ""}`,
  );

  if (!isFinalBatch) {
    return { positions: insertRows.length, didClearExisting };
  }

  if (insertRows.length === 0 && clearExisting) {
    throw new Error("No lap chart rows parsed; existing position data was preserved");
  }

  const { count, error } = await supabase
    .from("race_positions")
    .select("*", { head: true, count: "exact" })
    .eq("race_id", raceId);
  if (error) throw new Error(`Failed counting lap chart rows: ${error.message}`);
  if (!count) throw new Error("No lap chart rows parsed; existing position data was preserved");

  await markFileReceived(supabase, raceId, "lap_chart");
  console.log(`Parsed lap chart: ${count} position records`);
  return { positions: count, didClearExisting };
}

async function parsePitStops(supabase: any, pdf: any, raceId: string) {
  const stops: any[] = [];
  let currentCar = "";
  let currentDriver = "";
  let pendingStop: any = null;

  for (let p = 1; p <= pdf.numPages; p++) {
    const lines = await getPageLines(pdf, p);
    for (const line of lines) {
      // Driver header: "{totalStops} Pit Stop(s) {driverName} {CET} {carNum} {rank}"
      // May be prefixed with sub-header text on same line
      const driverM = line.match(/(\d+)\s+Pit\s+Stops?\s+(.+?)\s+(D\/[CH]\/F)\s+(\d+)\s+(\d+)/);
      if (driverM) {
        if (pendingStop) {
          stops.push(pendingStop);
          pendingStop = null;
        }
        currentCar = driverM[4];
        currentDriver = driverM[2].trim();
        continue;
      }

      if (!currentCar) continue;

      // Stop data: "lap raceLap time" (stop number on next line)
      const dataM = line.match(/^(\d+)\s+(\d+)\s+([\d:\.]+)$/);
      if (dataM) {
        if (pendingStop) stops.push(pendingStop);
        pendingStop = {
          race_id: raceId,
          car_number: currentCar,
          driver_name: currentDriver,
          lap_number: parseInt(dataM[1]),
          race_lap: parseInt(dataM[2]),
          time_of_race: dataM[3],
          stop_number: 0,
        };
        continue;
      }

      // Stop number on its own line
      const stopNumM = line.match(/^(\d+)$/);
      if (stopNumM && pendingStop && parseInt(stopNumM[1]) <= 20) {
        pendingStop.stop_number = parseInt(stopNumM[1]);
        stops.push(pendingStop);
        pendingStop = null;
        continue;
      }

      // Also try combined format: "stopNum lap raceLap time"
      const combinedM = line.match(/^(\d+)\s+(\d+)\s+(\d+)\s+([\d:\.]+)$/);
      if (combinedM && parseInt(combinedM[1]) <= 20) {
        stops.push({
          race_id: raceId,
          car_number: currentCar,
          driver_name: currentDriver,
          stop_number: parseInt(combinedM[1]),
          lap_number: parseInt(combinedM[2]),
          race_lap: parseInt(combinedM[3]),
          time_of_race: combinedM[4],
        });
      }
    }
  }
  if (pendingStop) stops.push(pendingStop);
  if (stops.length === 0) throw new Error("No pit stop rows parsed; existing pit stop data was preserved");
  await replaceRows(supabase, "pit_stops", { race_id: raceId }, stops);
  await markFileReceived(supabase, raceId, "pit_stops");
  console.log(`Parsed pit stops: ${stops.length} stops`);
  return { stops: stops.length };
}

async function parseSectionTimes(supabase: any, pdf: any, raceId: string, sessionType: string) {
  const rows: any[] = [];

  for (let p = 1; p <= pdf.numPages; p++) {
    const lines = await getPageLines(pdf, p);
    const sectionLine = lines.find((l) => l.includes("Section:")) || "";
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
          lap_number: parseInt(m[7]),
        });
      }
    }
  }

  if (rows.length === 0) throw new Error(`No section-time rows parsed for ${sessionType}; existing data was preserved`);
  await replaceRows(supabase, "fastest_laps", { race_id: raceId, session_type: sessionType }, rows);
  const sessionKeyMap: Record<string, string> = {
    Race: "section_times_race",
    "Practice 1": "section_times_practice_1",
    "Practice 2": "section_times_practice_2",
    "Practice Final": "section_times_practice_final",
    Qualifying: "section_times_qualifying",
    "Qualifying Group 1": "section_times_qualifying_group_1",
    "Qualifying Group 2": "section_times_qualifying_group_2",
    "Qualifying Round 2 (Fast 12)": "section_times_qualifying_round_2",
    "Qualifying Round 3 (Fast 6)": "section_times_qualifying_round_3",
  };
  await markFileReceived(
    supabase,
    raceId,
    sessionKeyMap[sessionType] || `section_times_${sessionType.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
  );
  return { rows: rows.length, sections: pdf.numPages };
}

async function parseSessionResults(supabase: any, lines: string[], raceId: string, sessionType: string) {
  const results: any[] = [];
  let inData = false;

  for (const line of lines) {
    if (line.includes("Rank Car Driver")) {
      inData = true;
      continue;
    }
    if (line.includes("(C)hassis:")) break;
    if (!inData) continue;
    const m = line.match(
      /^(\d+)\s+(\d+)\s+(.+?)\s+(D\/[CH]\/F)\s+([\d:\.]+)\s+([\d\.]+)\s+([\d\-\.]+)\s+([\d\-\.]+)\s+(\d+)\s+(\d+)/,
    );
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
        total_laps: parseInt(m[10]),
      });
    } else {
      // Combined qualifying format: rank car driver engine time speed sessionName
      const mCombined = line.match(/^(\d+)\s+(\d+)\s+(.+?)\s+(D\/[CH]\/F)\s+([\d:\.]+)\s+([\d\.]+)\s+(.+)$/);
      if (mCombined && !mCombined[7].match(/^\d/)) {
        results.push({
          race_id: raceId,
          session_type: sessionType,
          rank: parseInt(mCombined[1]),
          car_number: mCombined[2],
          driver_name: mCombined[3].trim(),
          engine: parseEngine(mCombined[4]),
          best_time: mCombined[5],
          best_speed: parseFloat(mCombined[6]),
          diff_to_leader: null,
          gap_to_ahead: null,
          best_lap_number: null,
          total_laps: null,
        });
      } else {
        // DNP driver — has rank, car, name, engine but no times
        const dnp = line.match(/^(\d+)\s+(\d+)\s+(.+?)\s+(D\/[CH]\/F)\s*(\d+)?$/);
        if (dnp) {
          results.push({
            race_id: raceId,
            session_type: sessionType,
            rank: parseInt(dnp[1]),
            car_number: dnp[2],
            driver_name: dnp[3].trim(),
            engine: parseEngine(dnp[4]),
            best_time: null,
            best_speed: null,
            diff_to_leader: null,
            gap_to_ahead: null,
            best_lap_number: null,
            total_laps: dnp[5] ? parseInt(dnp[5]) : 0,
          });
        }
      }
    }
  }
  if (results.length === 0)
    throw new Error(`No session result rows parsed for ${sessionType}; existing data was preserved`);
  await replaceRows(supabase, "session_full_results", { race_id: raceId, session_type: sessionType }, results);
  return { drivers: results.length };
}

async function parseQualifyingResults(supabase: any, lines: string[], raceId: string) {
  const results: any[] = [];
  let inData = false;
  let pendingSpeed: number | null = null;

  for (const line of lines) {
    if (line.includes("Rank Car Driver")) {
      inData = true;
      continue;
    }
    if (line.includes("(C)hassis:")) break;
    if (!inData) continue;

    const speedOnly = line.match(/^([\d\.]+)$/);
    if (speedOnly && parseFloat(speedOnly[1]) > 100 && parseFloat(speedOnly[1]) < 300) {
      pendingSpeed = parseFloat(speedOnly[1]);
      continue;
    }

    const m = line.match(/^(\d+)\s+(\d+)\s+(.+?)\s+(D\/[CH]\/F)\s+([\d\.]+)\s+([\d\.]+)\s+([\d:\.]+)\s+([\d\.]+)/);
    if (m) {
      const l1 = parseFloat(m[5]);
      const l2 = parseFloat(m[6]);
      results.push({
        race_id: raceId,
        qual_position: parseInt(m[1]),
        car_number: m[2],
        driver_name: m[3].trim(),
        engine: parseEngine(m[4]),
        lap1_time: m[5],
        lap2_time: m[6],
        total_time: m[7],
        avg_speed: parseFloat(m[8]),
        best_lap_time: String(Math.min(l1, l2)),
        comment: null,
      });
      pendingSpeed = null;
      continue;
    }

    const m2 = line.match(/^(\d+)\s+(\d+)\s+(.+?)\s+(D\/[CH]\/F)\s+([\d\.]+)\s+([\d\.]+)\s+([\d:\.]+)$/);
    if (m2) {
      const l1 = parseFloat(m2[5]);
      const l2 = parseFloat(m2[6]);
      results.push({
        race_id: raceId,
        qual_position: parseInt(m2[1]),
        car_number: m2[2],
        driver_name: m2[3].trim(),
        engine: parseEngine(m2[4]),
        lap1_time: m2[5],
        lap2_time: m2[6],
        total_time: m2[7],
        avg_speed: pendingSpeed,
        best_lap_time: String(Math.min(l1, l2)),
        comment: null,
      });
      pendingSpeed = null;
      continue;
    }

    const dnqM = line.match(/^(\d+)\s+(\d+)\s+(.+?)\s+(D\/[CH]\/F)\s+([\d\.]+)\s+DNQ/);
    if (dnqM) {
      results.push({
        race_id: raceId,
        qual_position: parseInt(dnqM[1]),
        car_number: dnqM[2],
        driver_name: dnqM[3].trim(),
        engine: parseEngine(dnqM[4]),
        lap1_time: dnqM[5],
        lap2_time: null,
        total_time: null,
        avg_speed: null,
        best_lap_time: dnqM[5],
        comment: "DNQ",
      });
      pendingSpeed = null;
      continue;
    }

    const noTimeM = line.match(/^(\d+)\s+(\d+)\s+(.+?)\s+(D\/[CH]\/F)\s+No Time/);
    if (noTimeM) {
      results.push({
        race_id: raceId,
        qual_position: parseInt(noTimeM[1]),
        car_number: noTimeM[2],
        driver_name: noTimeM[3].trim(),
        engine: parseEngine(noTimeM[4]),
        lap1_time: null,
        lap2_time: null,
        total_time: null,
        avg_speed: null,
        best_lap_time: null,
        comment: "DNQ",
      });
      pendingSpeed = null;
      continue;
    }

    const bareDnpM = line.match(/^(\d+)\s+(\d+)\s+(.+?)\s+(D\/[CH]\/F)$/);
    if (bareDnpM) {
      results.push({
        race_id: raceId,
        qual_position: parseInt(bareDnpM[1]),
        car_number: bareDnpM[2],
        driver_name: bareDnpM[3].trim(),
        engine: parseEngine(bareDnpM[4]),
        lap1_time: null,
        lap2_time: null,
        total_time: null,
        avg_speed: null,
        best_lap_time: null,
        comment: "DNQ",
      });
      pendingSpeed = null;
    }
  }

  if (results.length === 0) throw new Error("No qualifying rows parsed; existing qualifying data was preserved");
  await replaceRows(supabase, "qualifying_results", { race_id: raceId }, results);
  console.log(`Parsed qualifying: ${results.length} drivers`);
  return { drivers: results.length };
}

async function parseCombinedPractice(supabase: any, lines: string[], raceId: string) {
  const results: any[] = [];
  let inData = false;

  for (const line of lines) {
    if (line.includes("Rank Car Driver")) {
      inData = true;
      continue;
    }
    if (line.includes("(C)hassis:") || line.includes("Information provided by Indy Racing Information System")) break;
    if (!inData) continue;

    const tokens = line.trim().split(/\s+/);
    if (tokens.length < 8) continue;

    const rank = parseInt(tokens[0]);
    const carNumber = tokens[1];
    const cetIndex = tokens.findIndex((token) => /^D\/[CH]\/F$/.test(token));
    if (Number.isNaN(rank) || cetIndex < 0 || cetIndex <= 2) continue;

    const totalLaps = parseInt(tokens[tokens.length - 1]);
    const bestSpeed = parseFloat(tokens[tokens.length - 2]);
    const bestTime = tokens[tokens.length - 3];

    if (Number.isNaN(totalLaps) || Number.isNaN(bestSpeed) || !/^\d{2}:\d{2}\.\d+$/.test(bestTime)) continue;

    const driverName = tokens.slice(2, cetIndex).join(" ").trim();
    const bestSession = tokens
      .slice(cetIndex + 1, tokens.length - 3)
      .join(" ")
      .trim();
    if (!driverName || !bestSession) continue;

    results.push({
      race_id: raceId,
      rank,
      car_number: carNumber,
      driver_name: driverName,
      engine: parseEngine(tokens[cetIndex]),
      best_session: bestSession,
      best_time: bestTime,
      best_speed: bestSpeed,
      total_laps: totalLaps,
    });
  }
  if (results.length === 0)
    throw new Error("No combined practice rows parsed; existing combined practice data was preserved");
  await replaceRows(supabase, "combined_practice_results", { race_id: raceId }, results);
  return { drivers: results.length };
}

async function parseQualifyingSectors(supabase: any, pdf: any, raceId: string) {
  const sectorNames = [
    "dogleg",
    "front_stretch",
    "turn1_entry",
    "turn1_exit",
    "turn2_entry",
    "turn2_exit",
    "turn3_entry",
    "turn3_exit",
    "turn4",
    "full_lap",
  ];
  const rows: any[] = [];

  for (let p = 1; p <= pdf.numPages; p++) {
    const lines = await getPageLines(pdf, p);
    const driverLine = lines.find((l) => l.includes("Section Data for Car"));
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
      if (line.trim() === "1") {
        currentLap = 1;
        expectingSpeed = false;
        continue;
      }
      if (line.trim() === "2") {
        currentLap = 2;
        expectingSpeed = false;
        continue;
      }
      const tMatch = line.match(/^T\s+([\d\s\.]+)/);
      if (tMatch && currentLap > 0) {
        const vals = tMatch[1]
          .trim()
          .split(/\s+/)
          .map(Number)
          .filter((n) => !isNaN(n));
        if (currentLap === 1) lap1Times = vals;
        else lap2Times = vals;
        expectingSpeed = true;
        continue;
      }
      const sMatch = line.match(/^S\s+([\d\s\.]+)/);
      if (sMatch && currentLap > 0 && expectingSpeed) {
        const vals = sMatch[1]
          .trim()
          .split(/\s+/)
          .map(Number)
          .filter((n) => !isNaN(n));
        if (currentLap === 1) lap1Speeds = vals;
        else lap2Speeds = vals;
        expectingSpeed = false;
      }
    }

    if (lap1Times.length >= 9) {
      const row: any = { race_id: raceId, car_number: carNumber, driver_name: driverName, lap_number: 1 };
      sectorNames.forEach((name, i) => {
        row[`${name}_time`] = lap1Times[i] ?? null;
        row[`${name}_speed`] = lap1Speeds[i] ?? null;
      });
      rows.push(row);
    }
    if (lap2Times.length >= 9) {
      const row: any = { race_id: raceId, car_number: carNumber, driver_name: driverName, lap_number: 2 };
      sectorNames.forEach((name, i) => {
        row[`${name}_time`] = lap2Times[i] ?? null;
        row[`${name}_speed`] = lap2Speeds[i] ?? null;
      });
      rows.push(row);
    }
  }

  if (rows.length === 0)
    throw new Error("No qualifying sector rows parsed; existing qualifying sector data was preserved");
  await replaceRows(supabase, "qualifying_sectors", { race_id: raceId }, rows);
  return { drivers: rows.length };
}

    if (!headerLine) continue;

    // Dynamically find the PI to PO column index from the header
    // Header format: "Lap  T/S  Sec1  Sec2  ...  PI to PO  Elapsed  Lap" (varies by track)
    const headerParts = headerLine.trim().split(/\s{2,}/);
    const piToPoHeaderIdx = headerParts.findIndex((p: string) => p.includes("PI to PO"));
    if (piToPoHeaderIdx === -1) continue;

    // Find where data columns start (skip Lap, T/S, I/O headers)
    let dataStartIdx = 0;
    for (let h = 0; h < headerParts.length; h++) {
      const part = headerParts[h].trim().toLowerCase();
      if (part === "lap" || part === "t/s" || part === "i/o") {
        dataStartIdx = h + 1;
      } else {
        break;
      }
    }
    const piToPoDataIdx = piToPoHeaderIdx - dataStartIdx;
    if (piToPoDataIdx < 0) continue;

    console.log(`Car ${carNumber}: PI to PO at data column ${piToPoDataIdx} (header parts: ${headerParts.length}, header idx: ${piToPoHeaderIdx}, data start: ${dataStartIdx})`);

    let currentLap = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      const lapOnlyMatch = line.trim().match(/^(\d+)$/);
      if (lapOnlyMatch) {
        currentLap = parseInt(lapOnlyMatch[1]);
        continue;
      }

      if (line.trim().startsWith("T ") && currentLap > 0) {
        const values = line.trim().replace(/^T\s+/, "").split(/\s+/).map(parseFloat);

        if (values.length > piToPoDataIdx && !isNaN(values[piToPoDataIdx])) {
          const pitTime = values[piToPoDataIdx];

          // Accept pit times from 5s (fast ovals) to 120s (long street courses)
          if (pitTime >= 5 && pitTime <= 120) {
            let pitSpeed: number | null = null;
            if (i + 2 < lines.length && lines[i + 2].trim().startsWith("S ")) {
              const speedValues = lines[i + 2].trim().replace(/^S\s+/, "").split(/\s+/).map(parseFloat);
              if (speedValues.length > piToPoDataIdx && !isNaN(speedValues[piToPoDataIdx])) {
                pitSpeed = speedValues[piToPoDataIdx];
              }
            }

            pitRows.push({
              race_id: raceId,
              car_number: carNumber,
              driver_name: driverName,
              lap_number: currentLap,
              pit_time_seconds: pitTime,
              pit_speed: pitSpeed,
            });
          }
        }
      }
    }
  }

  if (pitRows.length > 0) {
    if (clearExisting) {
      await supabase.from("race_pit_times").delete().eq("race_id", raceId);
      didClearExisting = true;
    }
    for (let i = 0; i < pitRows.length; i += 500) {
      const chunk = pitRows.slice(i, i + 500);
      const { error } = await supabase.from("race_pit_times").insert(chunk);
      if (error) throw new Error(`Failed inserting pit times: ${error.message}`);
    }
  }

  console.log(
    `Section data batch pages ${startPage}-${endPage}: ${pitRows.length} rows${didClearExisting ? " (cleared existing)" : ""}`,
  );

  if (!isFinalBatch) {
    return { pitStops: pitRows.length, didClearExisting };
  }

  if (pitRows.length === 0 && clearExisting) {
    return { message: "No pit time rows found", pitStops: 0, didClearExisting };
  }

  const { count, error } = await supabase
    .from("race_pit_times")
    .select("*", { head: true, count: "exact" })
    .eq("race_id", raceId);
  if (error) throw new Error(`Failed counting pit times: ${error.message}`);
  if (!count) {
    return { message: "No pit time rows found", pitStops: 0, didClearExisting };
  }

  await markFileReceived(supabase, raceId, "section_data_race");
  console.log(`Parsed section data race: ${count} pit time records`);
  return { pitStops: count, didClearExisting };
}
