import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) throw new Error('No file provided');

    // For now, return a placeholder - PDF parsing requires pdfjs which is complex in Deno
    // The actual parsing logic would extract text and identify report type
    const text = await file.text();
    
    let reportType = 'unknown';
    if (text.includes('Official Lap Report') || text.includes('Race Results')) reportType = 'Race Results';
    else if (text.includes('Race Lap Chart') || text.includes('Lap Chart')) reportType = 'Lap Chart';
    else if (text.includes('Leader Lap Summary')) reportType = 'Leader Lap Summary';
    else if (text.includes('Pit Stop Summary')) reportType = 'Pit Stop Summary';
    else if (text.includes('Top Section Times') || text.includes('Section Times')) reportType = 'Top Section Times';
    else if (text.includes('Event Summary')) reportType = 'Event Summary';

    return new Response(
      JSON.stringify({ success: true, reportType, fileName: file.name }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
