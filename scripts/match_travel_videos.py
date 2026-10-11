"""Freeze reviewed official YouTube matches, never infer links from generated titles."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from html.parser import HTMLParser
import json,re,urllib.request,sys
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'artifacts/travel-archive'
MATCHES={
 'thailand':['EAHLqpQsGxs','MCZ9gv3rpgk','g9L0xUo6axQ','x2oLHu6-hVE','734w8hE4l9s','EsFT0CzWxGw','KbJUj6xKnuo','mFFM41k-4LU'],
 'manila':['992cQDweFOw','dZzJxISSdIg','SzCfcC_28HY','HQNbV7agt8U','epaSkda5tvk','2suGzjt8qL4','bJzDDgnTFwY'],
 'kanazawa':['A3LjSHSgwOs'],
 'cebu4':['NW-vRtzslXc','PVQVnra14jk','Ot5hZDzn-Ng','UhVU2hn7VtY','pVJb3vjQYmQ','lwEzqPnYdHE','7Lh9JpyFz-8'],
 'hochiminh2':['1mDMSTezImU','Qxv9PbKnzjo','aQuaj411_d4','CsEtxh15GTI','KrAYuoXVLjw','RdrRtoxYv_w','SmyUMEp8Azo','N0FtW9i7V00','acFVLuU_Ego'],
 'manila-cebu':['yI30hULTkbk','T4Azkowjg14','zeFtdtCWBQ4','1Y8eGLcjuKg','UiR5Un0WFbg','Gw1HCdacuTg','bfFQKmEAKgM','03-PgB4_bGA','-g40tdk8IRQ','uaYKy_rDkGE','RW74Ci5XJL0'],
 'takanawa':['T8fWpREZLpY'],
 'manila2':['l4wZmpjWOeE','wo2QqnR2_Ro','5mqi8FUpd6g','7qmk7Awc-7o','8FFl37RWo5g','RM3Q2PNGPqw','KO8KFlJdHOA','uf67dP5Cg70','Y2tN7WX6OjU'],
 'manila3':['UqfJzTgl2eY'],
 'hanoi-hochiminh':['FvYrEfrj-6c','Otb5rmwjyUI','5q52WmEzeVw','YPNb68PVSYA']
}
class Meta(HTMLParser):
 def __init__(self):super().__init__();self.data={}
 def handle_starttag(self,t,attrs):
  if t!='meta':return
  a=dict(attrs);key=a.get('itemprop',a.get('name',a.get('property','')))
  if key in ['title','description','uploadDate','duration','datePublished']:self.data[key]=a.get('content')
def fetch(vid):
 req=urllib.request.Request('https://www.youtube.com/watch?v='+vid+'&hl=ja',headers={'User-Agent':'Mozilla/5.0','Accept-Language':'ja-JP,ja;q=0.9'})
 with urllib.request.urlopen(req,timeout=35) as r:raw=r.read().decode('utf-8')
 m=Meta();m.feed(raw);data=m.data
 desc=re.search(r'"shortDescription"\s*:\s*("(?:\\.|[^"\\])*")',raw)
 if desc:
  try:data['fullDescription']=json.loads(desc[1])
  except ValueError:pass
 data['source']='https://www.youtube.com/watch?v='+vid;data['checkedOn']='2026-10-11'
 return vid,data
def main():
 from inventory_travel_archive import cues,read_text
 rows=json.loads((OUT/'inventory.json').read_text(encoding='utf-8'));channel=json.loads((OUT/'youtube-channel-ja.json').read_text(encoding='utf-8-sig'));official={v['id']:v for v in channel['entries']}
 for r in rows:
  vid=MATCHES[r['series']][r['episode']-1];r['youtubeId']=vid;r['youtubeTitle']=official[vid]['title'];r['youtubeDuration']=official[vid].get('duration')
  if not r.get('srt'):
   sub=OUT/'recovered'/f'{vid}.ja-orig.srt'
   if sub.exists():
    raw=cues(read_text(sub));clean=[];recent=[]
    for c in raw:
     lines=re.sub('<[^>]+>','',c['text']).strip().splitlines();new=[]
     for line in lines:
      if line not in recent[-3:]:new.append(line);recent.append(line)
     if new:c['text']=' '.join(new);clean.append(c)
    target=OUT/r['slug'];target.mkdir(exist_ok=True)
    (target/'transcript.json').write_text(json.dumps(clean,ensure_ascii=False,indent=2),encoding='utf-8',newline='\n')
    (target/'transcript.txt').write_text('\n'.join(f"{c['at']} {c['text']}" for c in clean),encoding='utf-8',newline='\n')
    r['srt']=str(sub);r['subtitleSource']='official-youtube-auto-ja';r['cueCount']=len(clean);r['subtitleDuration']=clean[-1]['end']
    candidates=[v for v in r['videoCandidates'] if 'duration' in v];candidates.sort(key=lambda v:abs(v['duration']-r['youtubeDuration']))
    if candidates:r['video']=candidates[0]['path'];r['videoDuration']=candidates[0]['duration']
  r['youtubeLocalDurationDelta']=round(r.get('videoDuration',0)-r['youtubeDuration'],2)
 ids=[r['youtubeId'] for r in rows]+['7xOr6yXy8E8','6qQDsV-Hco0','dBa2MZrDyLA','8kUN9mQad7w','qWZj225B5uU','cwyNmj6or5g']
 out={}
 with ThreadPoolExecutor(max_workers=4) as pool:
  for vid,data in pool.map(fetch,ids):out[vid]=data
 (OUT/'youtube-metadata.json').write_text(json.dumps(out,ensure_ascii=False,indent=2),encoding='utf-8',newline='\n')
 for r in rows:
  y=out[r['youtubeId']];r['youtubeTitle']=y.get('title') or r['youtubeTitle'];r['uploadDate']=y.get('uploadDate');r['youtubeDescription']=y.get('fullDescription',y.get('description',''))
 (OUT/'inventory.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding='utf-8',newline='\n')
 print(json.dumps({'matched':len(rows),'missingSource':[r['slug'] for r in rows if not r.get('srt') or not r.get('video')],'largeDurationDifferences':[{k:r[k] for k in ['slug','video','youtubeTitle','youtubeLocalDurationDelta']} for r in rows if abs(r['youtubeLocalDurationDelta'])>5]},ensure_ascii=False))
if __name__=='__main__':main()
