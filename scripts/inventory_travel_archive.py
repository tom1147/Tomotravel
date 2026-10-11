"""Inventory only the user-requested travel folders; never modify source drives."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import json,re,subprocess

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'artifacts/travel-archive'
SERIES=[
 ('thailand','タイ編','F:/',r'タイ編(\d+)$'),
 ('manila','マニラ編','F:/',r'マニラ編(\d+)$'),
 ('kanazawa','金沢','F:/',r'金沢$'),
 ('cebu4','セブ島フォース','D:/',r'セブ島フォース(\d*)$'),
 ('hochiminh2','ホーチミンセカンド','D:/',r'ホーチミンセカンド(\d+)$'),
 ('manila-cebu','マニラセブ最終回編','D:/',r'マニラセブ最終回(\d+)$'),
 ('takanawa','高輪ゲートウェイ','D:/',r'高輪ゲートウェイ$'),
 ('manila2','マニラ編セカンド','K:/',r'マニラ編セカンド(\d+)$'),
 ('manila3','マニラ編サード','K:/',r'マニラ編サード(1)$'),
 ('hanoi-hochiminh','ハノイ・ホーチミン編','K:/',r'ハノイ・ホーチミン編([1-4])$')
]
def read_text(p):
 b=p.read_bytes()
 for enc in (['utf-16'] if b[:2] in (b'\xff\xfe',b'\xfe\xff') else ['utf-8-sig','cp932']):
  try:return b.decode(enc)
  except UnicodeError:continue
 return None
def seconds(t):
 h,m,s=re.split('[:,.]',t)[:3];return int(h)*3600+int(m)*60+int(s)
def cues(text):
 pattern=r'(\d{1,2}:\d{2}:\d{2}[,.]\d{1,3})\s*(?:-->|,)\s*(\d{1,2}:\d{2}:\d{2}[,.]\d{1,3})[^\n]*\n(.*?)(?=\n\s*\n|\Z)'
 return [{'start':seconds(a),'end':seconds(b),'at':a,'text':' '.join(s.strip().splitlines())} for a,b,s in re.findall(pattern,text or '',re.S)]
def probe(p):
 try:
  data=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration:stream=width,height','-of','json',str(p)],stderr=subprocess.DEVNULL,timeout=20))
  return {'path':str(p),'bytes':p.stat().st_size,'duration':float(data['format']['duration']),'width':data['streams'][0].get('width'),'height':data['streams'][0].get('height')}
 except Exception as e:return {'path':str(p),'error':str(e)}
def folder(row):
 p=Path(row['folder']); files=list(p.rglob('*'))
 subtitle=[]
 for f in files:
  if not f.is_file() or f.suffix.lower() not in ('.srt','.txt'):continue
  if re.search('英語|英字幕|ベトナム語|中国|韓国|タイ語|タガログ|english|vietnam|china',f.name,re.I):continue
  text=read_text(f);c=cues(text)
  if not c:continue
  rank=100 if '日本語' in f.name else 40 if re.search('字幕|srt',f.name,re.I) else 10
  if f.name in ['日本語字幕.srt','日本語.srt']:rank+=20
  if row.get('preferredSrt')==f.name:rank+=200
  subtitle.append({'path':str(f),'cueCount':len(c),'duration':c[-1]['end'],'rank':rank,'cues':c})
 subtitle.sort(key=lambda x:(-x['rank'],-x['cueCount']))
 videos=[f for f in files if f.is_file() and f.suffix.lower() in ('.mp4','.mov','.mkv') and f.stat().st_size>40_000_000 and not re.search('英語|english|中国|china|ベトナム語',f.name,re.I)]
 named=[f for f in videos if re.search('完成|最終|最後|本番|修正|最新|字幕|編|金沢|高輪',f.stem) and not re.fullmatch(r'\d+.*',f.stem)]
 candidates=named or [f for f in videos if not re.fullmatch(r'\d+(?:\.\d+)?',f.stem)] or videos
 row['subtitleCandidates']=[{k:v for k,v in s.items() if k!='cues'} for s in subtitle]
 if subtitle:
  selected=subtitle[0];row['srt']=selected['path'];row['subtitleDuration']=selected['duration'];row['cueCount']=selected['cueCount']
  target=OUT/row['slug'];target.mkdir(parents=True,exist_ok=True)
  (target/'transcript.json').write_text(json.dumps(selected['cues'],ensure_ascii=False,indent=2),encoding='utf-8',newline='\n')
  (target/'transcript.txt').write_text('\n'.join(f"{c['at']} {c['text']}" for c in selected['cues']),encoding='utf-8',newline='\n')
 row['videoCandidates']=[probe(f) for f in candidates]
 if subtitle and row['videoCandidates']:
  good=[v for v in row['videoCandidates'] if 'duration' in v]
  good.sort(key=lambda v:abs(v['duration']-selected['duration']))
  if good:row['video']=good[0]['path'];row['videoDuration']=good[0]['duration'];row['durationDelta']=round(good[0]['duration']-selected['duration'],2)
 return row
def main():
 OUT.mkdir(parents=True,exist_ok=True);rows=[]
 for order,(code,label,drive,pattern) in enumerate(SERIES):
  for p in Path(drive).iterdir():
   if not p.is_dir():continue
   m=re.fullmatch(pattern,p.name)
   if not m:continue
   n=int((m[1] if m.lastindex else '') or 1)
   rows.append({'series':code,'seriesLabel':label,'seriesOrder':order,'episode':n,'slug':f'{code}-{n:02}','folder':str(p)})
   if code=='manila2' and n==6 and (p/'マニラ編セカンド7日本語字幕.srt').exists():
    rows.append({'series':code,'seriesLabel':label,'seriesOrder':order,'episode':7,'slug':'manila2-07','folder':str(p),'preferredSrt':'マニラ編セカンド7日本語字幕.srt'})
 rows.sort(key=lambda r:(r['seriesOrder'],r['episode']))
 with ThreadPoolExecutor(max_workers=4) as pool:rows=list(pool.map(folder,rows))
 (OUT/'inventory.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding='utf-8',newline='\n')
 for r in rows:print(json.dumps({k:r.get(k) for k in ['slug','folder','srt','cueCount','video','videoDuration','durationDelta']},ensure_ascii=False),flush=True)
 print('TOTAL',len(rows))
if __name__=='__main__':main()
