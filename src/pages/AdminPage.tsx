import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const AdminPage = () => {
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('admin_auth') === 'true');
  const [error, setError] = useState('');

  // Season
  const [seasonYear, setSeasonYear] = useState(new Date().getFullYear());
  const [totalRounds, setTotalRounds] = useState(18);
  const [seasons, setSeasons] = useState<any[]>([]);
  const [races, setRaces] = useState<any[]>([]);
  const [pendingRaces, setPendingRaces] = useState<any[]>([]);

  // Upload
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<string[]>([]);
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    if (authed) { loadData(); }
  }, [authed]);

  const loadData = async () => {
    const [{ data: s }, { data: r }, { data: p }] = await Promise.all([
      supabase.from('seasons').select('*').order('year', { ascending: false }),
      supabase.from('races').select('*').eq('status', 'complete').order('race_date', { ascending: false }),
      supabase.from('races').select('*').eq('status', 'pending').order('race_date', { ascending: false }),
    ]);
    setSeasons(s || []);
    setRaces(r || []);
    setPendingRaces(p || []);
  };

  const handleLogin = async () => {
    try {
      const res = await supabase.functions.invoke('admin-auth', { body: { password } });
      if (res.data?.success) {
        sessionStorage.setItem('admin_auth', 'true');
        setAuthed(true);
        setError('');
      } else {
        setError('Incorrect password');
      }
    } catch { setError('Auth error'); }
  };

  const handleSaveSeason = async () => {
    await supabase.from('seasons').upsert({ year: seasonYear, total_rounds: totalRounds, series_name: 'NTT INDYCAR SERIES' }, { onConflict: 'year' });
    loadData();
  };

  const handleUpload = async () => {
    if (!files.length) return;
    setUploading(true); setUploadResult([]); setUploadError('');
    const results: string[] = [];
    const errors: string[] = [];
    for (const file of files) {
      try {
        let nextPage: number | null = 1;
        let clearExisting = true;
        let finalData: any = null;

        while (nextPage) {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('startPage', String(nextPage));
          formData.append('clearExisting', clearExisting ? 'true' : 'false');

          const res = await supabase.functions.invoke('parse-race-pdf', { body: formData });
          if (res.error) throw res.error;

          finalData = res.data;
          if (finalData?.didClearExisting) clearExisting = false;

          if (finalData?.hasMore) {
            if (!finalData?.nextPage) throw new Error('Missing next page for continued parsing');
            nextPage = finalData.nextPage;
          } else {
            nextPage = null;
          }
        }

        if (finalData?.skipped) {
          results.push(`⊘ ${file.name} → skipped (${finalData?.message || finalData?.reportType || 'not needed'})`);
        } else {
          results.push(`✓ ${file.name} → ${finalData?.reportType || 'parsed'}`);
        }
      } catch (e: any) {
        errors.push(`✗ ${file.name}: ${e.message}`);
      }
    }
    setUploadResult(results);
    setUploadError(errors.length ? errors.join('\n') : '');
    setFiles([]);
    loadData();
    setUploading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this race and all its data?')) return;
    await supabase.from('races').delete().eq('id', id);
    loadData();
  };

  if (!authed) {
    return (
      <div className="min-h-screen bg-racing-bg flex items-center justify-center">
        <div className="bg-racing-surface rounded p-8 w-full max-w-sm">
          <h1 className="font-heading text-2xl text-racing-blue mb-4">ADMIN LOGIN</h1>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="Enter admin password" className="w-full bg-racing-bg border border-racing-border text-racing-text font-mono text-[15px] px-3 py-2 rounded mb-3" />
          {error && <p className="text-racing-red font-mono text-sm mb-3">{error}</p>}
          <button onClick={handleLogin} className="w-full bg-racing-blue text-white font-condensed font-semibold py-2 rounded hover:opacity-90">Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-racing-bg">
      <header className="bg-racing-bg border-b-2 border-racing-yellow px-4 py-3">
        <h1 className="font-heading text-[28px] text-racing-blue">RACEDAY PADDOCK</h1>
        <p className="font-condensed text-[12px] text-racing-muted uppercase tracking-[0.2em]">RACE DATA ADMIN</p>
      </header>

      <div className="max-w-[1000px] mx-auto px-4 py-6 space-y-8">
        {/* Season Setup */}
        <section className="bg-racing-surface rounded p-6">
          <h2 className="font-heading text-xl text-racing-text mb-4">Season Setup</h2>
          <div className="flex gap-3 items-end mb-4">
            <div>
              <label className="font-condensed text-sm text-racing-muted block mb-1">Year</label>
              <input type="number" value={seasonYear} onChange={e => setSeasonYear(Number(e.target.value))}
                className="bg-racing-bg border border-racing-border text-racing-text font-mono text-[15px] px-3 py-2 rounded w-24" />
            </div>
            <div>
              <label className="font-condensed text-sm text-racing-muted block mb-1">Total Rounds</label>
              <input type="number" value={totalRounds} onChange={e => setTotalRounds(Number(e.target.value))}
                className="bg-racing-bg border border-racing-border text-racing-text font-mono text-[15px] px-3 py-2 rounded w-20" />
            </div>
            <button onClick={handleSaveSeason} className="bg-racing-blue text-white font-condensed font-semibold px-4 py-2 rounded hover:opacity-90">Save</button>
          </div>
          {seasons.length > 0 && (
            <table className="w-full text-left">
              <thead><tr className="border-b border-racing-border">
                <th className="font-condensed text-sm text-racing-muted px-2 py-1">Year</th>
                <th className="font-condensed text-sm text-racing-muted px-2 py-1">Rounds</th>
              </tr></thead>
              <tbody>{seasons.map(s => (
                <tr key={s.id} className="border-b border-racing-border/30">
                  <td className="px-2 py-1 font-mono text-[15px] text-racing-text">{s.year}</td>
                  <td className="px-2 py-1 font-mono text-[15px] text-racing-text">{s.total_rounds}</td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </section>

        {/* Upload */}
        <section className="bg-racing-surface rounded p-6">
          <h2 className="font-heading text-xl text-racing-text mb-4">Upload Race PDFs</h2>
          <p className="font-mono text-[12px] text-racing-muted mb-3">Drop race weekend PDFs here — upload any or all reports in any order</p>
          <input type="file" accept=".pdf" multiple onChange={e => setFiles(Array.from(e.target.files || []))}
            className="w-full bg-racing-bg border border-racing-border text-racing-text font-mono text-[15px] px-3 py-2 rounded mb-3 file:bg-racing-blue file:text-white file:border-0 file:rounded file:px-3 file:py-1 file:mr-3 file:font-condensed" />
          {files.length > 0 && <p className="font-mono text-sm text-racing-muted mb-3">{files.length} file(s) selected</p>}
          <button onClick={handleUpload} disabled={uploading || !files.length}
            className="bg-racing-blue text-white font-condensed font-semibold px-6 py-2 rounded hover:opacity-90 disabled:opacity-50">
            {uploading ? 'Parsing…' : 'Upload & Parse'}
          </button>
          {uploadResult.length > 0 && (
            <div className="mt-3 space-y-1">{uploadResult.map((r, i) => (
              <p key={i} className={`font-mono text-sm ${r.startsWith('⊘') ? 'text-racing-muted' : 'text-racing-green'}`}>{r}</p>
            ))}</div>
          )}
          {uploadError && (
            <div className="mt-3 space-y-1">{uploadError.split('\n').map((e, i) => <p key={i} className="font-mono text-sm text-racing-red">{e}</p>)}</div>
          )}
        </section>

        {/* Pending Races */}
        {pendingRaces.length > 0 && (
          <section className="bg-racing-surface rounded p-6">
            <h2 className="font-heading text-xl text-racing-text mb-4">Pending Races</h2>
            <div className="space-y-3">
              {pendingRaces.map(r => (
                <div key={r.id} className="bg-racing-bg rounded p-4 border border-racing-border">
                  <p className="font-condensed text-[15px] text-racing-text">{r.event_name} — {r.track_name} — Round {r.round_number}</p>
                  <p className="font-mono text-[12px] text-racing-muted mt-1">Status: Pending — waiting for all reports</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Complete Races */}
        <section className="bg-racing-surface rounded p-6">
          <h2 className="font-heading text-xl text-racing-text mb-4">Complete Races</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead><tr className="border-b border-racing-border">
                {['Round','Event','Track','Date','Actions'].map(h => (
                  <th key={h} className="font-condensed text-sm text-racing-muted uppercase px-3 py-2">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {races.map(r => (
                  <tr key={r.id} className="border-b border-racing-border/30">
                    <td className="px-3 py-2 font-mono text-[15px] text-racing-text">{r.round_number}</td>
                    <td className="px-3 py-2 font-body text-[15px] text-racing-text">{r.event_name}</td>
                    <td className="px-3 py-2 font-body text-[15px] text-racing-text">{r.track_name}</td>
                    <td className="px-3 py-2 font-mono text-sm text-racing-muted">{r.race_date}</td>
                    <td className="px-3 py-2">
                      <button onClick={() => handleDelete(r.id)} className="font-condensed text-sm text-racing-red hover:underline">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminPage;
