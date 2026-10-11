"""Prepare separate, reviewable frame candidates for each travel article."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import json,subprocess,argparse
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[1];BASE=ROOT/'artifacts/travel-archive'
def seconds(v):
 if isinstance(v,(int,float)):return float(v)
 if isinstance(v,str):
  if ':' not in v:return float(v)
  x=[float(s) for s in v.replace(',','.').split(':')];return sum(t*60**i for i,t in enumerate(reversed(x)))
 return None
def prepare(row):
 slug=row['slug'];source=BASE/'editorial'/f'{slug}.json';out=BASE/slug/'frames';jobfile=BASE/'asset-jobs'/f'{slug}.json'
 if not source.exists():return {'slug':slug,'status':'waiting-for-editorial'}
 if jobfile.exists():return {'slug':slug,'status':'ready'}
 d=json.loads(source.read_text(encoding='utf-8-sig'));selected=[]
 for s in d['sections']:
  t=seconds(s.get('imageTime'))
  if t is None or any(abs(t-x['baseTime'])<20 for x in selected):continue
  if row['slug']=='hochiminh2-01' and t>=1100:continue
  selected.append({'sectionId':s['id'],'baseTime':t,'description':s.get('imageDescription') or s['title']})
 selected=selected[:3 if row['videoDuration']>=720 else 2]
 if not selected:raise ValueError('No image candidates: '+slug)
 out.mkdir(parents=True,exist_ok=True);jobs=[]
 for i,scene in enumerate(selected,1):
  candidates=[]
  for j,delta in enumerate([0,3,7],1):
   t=min(row['videoDuration']-2,max(0,scene['baseTime']+delta));f=out/f'scene-{i:02}-candidate-{j}.jpg'
   subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-ss',str(t),'-i',row['video'],'-frames:v','1','-vf','scale=1920:-2','-q:v','2','-y',str(f)],check=True)
   candidates.append({'path':str(f),'time':t})
  jobs.append({'index':i,**scene,'candidates':candidates,'output':f'images/travel/{slug}/scene-{i:02}.webp'})
 sheet=Image.new('RGB',(1440,len(jobs)*296),(237,237,231));draw=ImageDraw.Draw(sheet)
 for i,j in enumerate(jobs):
  for k,c in enumerate(j['candidates']):
   im=Image.open(c['path']);im.thumbnail((480,270));x=k*480;y=i*296;sheet.paste(im,(x,y));draw.text((x+10,y+274),f"Scene {i+1} / Candidate {k+1} / {int(c['time'])//60:02}:{int(c['time'])%60:02}",fill='black')
 sheet.save(out/'contact.jpg')
 data={'slug':slug,'series':row['series'],'youtubeTitle':row['youtubeTitle'],'sourceVideo':row['video'],'contactSheet':str(out/'contact.jpg'),'scenes':jobs}
 jobfile.parent.mkdir(exist_ok=True);jobfile.write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8',newline='\n')
 return {'slug':slug,'status':'ready','scenes':len(jobs)}
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--partition',type=int);p.add_argument('--parts',type=int,default=3);p.add_argument('--workers',type=int,default=3);args=p.parse_args()
 rows=json.loads((BASE/'inventory.json').read_text(encoding='utf-8'));rows=[r for i,r in enumerate(rows) if args.partition is None or i%args.parts==args.partition]
 with ThreadPoolExecutor(max_workers=args.workers) as pool:results=list(pool.map(prepare,rows))
 print(json.dumps(results,ensure_ascii=False))
