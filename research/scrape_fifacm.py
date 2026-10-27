import re,html,json,time,subprocess,sys
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36"
import os,hashlib
def get(u):
    f='/tmp/cache_'+hashlib.md5(u.encode()).hexdigest()
    if os.path.exists(f): return open(f).read()
    r=subprocess.run(['curl','-s','-A',UA,u],capture_output=True,text=True).stdout
    open(f,'w').write(r); return r
    return subprocess.run(['curl','-s','-A',UA,u],capture_output=True,text=True).stdout
links=sys.argv[3].split(',') if len(sys.argv)>3 else sorted(set(re.findall(r'href="(/2\d/player/\d+/[^"]+)"',get(sys.argv[1]))))
out=[]
ATTR=['Crossing','Finishing','Heading Acc.','Short Pass','Volleys','Dribbling','Curve','FK Acc.','Long Pass','Ball Control','Shot Power','Jumping','Stamina','Strength','Long Shots','Acceleration','Sprint Speed','Agility','Reactions','Balance','Aggression','Interceptions','Att. Position','Vision','Penalties','Composure','Def. Awareness','Stand Tackle','Slide Tackle','GK Diving','GK Handling','GK Kicking','GK Positioning','GK Reflexes']
for l in links:
    t=get('https://www.fifacm.com'+l); time.sleep(0.6)
    s=re.sub(r'<script.*?</script>|<style.*?</style>','',t,flags=re.S)
    txt=html.unescape(re.sub(r'<[^>]+>','\n',s)); lines=[x.strip() for x in txt.split('\n') if x.strip()]
    p={'url':'https://www.fifacm.com'+l}
    m=re.search(r'<title>(.*?)</title>',t); p['title']=html.unescape(m.group(1)) if m else ''
    fn=re.search(r'player-firstname">(.*?)<',t); ln=re.search(r'player-lastname">(.*?)<',t)
    p['fullName']=html.unescape(((fn.group(1) if fn else '')+' '+(ln.group(1) if ln else '')).strip())
    m=re.search(r'Rating is (\d+)\. His potential is (\d+) and his position is (\w+)\. He is (\d+) years old',txt)
    if m: p['ovr'],p['pot'],p['mainPos'],p['age']=int(m[1]),int(m[2]),m[3],int(m[4])
    m=re.search(r'has (\d) Skill moves and (\d) Weak Foot, he is (\w+)-footed and his workrates are (\w+)/(\w+)',txt)
    if m: p['sm'],p['wf'],p['foot'],p['wrAtt'],p['wrDef']=int(m[1]),int(m[2]),m[3],m[4],m[5]
    m=re.search(r'height is (\d+)cm',txt); p['height']=int(m[1]) if m else None
    for a in ATTR:
        try:
            i=lines.index(a, lines.index('Category')); p.setdefault('attr',{})[a]=int(lines[i+1])
        except Exception: pass
    # positions ratings block
    i=t.find('Roles:'); j=t.find('PlayStyles:')
    rb=t[i:j]; roles={}
    if True:
        cur=None
        for m in re.finditer(r"color: #74718a;' >(\w+)</div>|<div class='mt-3'>(.*?)</div>",rb):
            if m.group(1): cur=m.group(1); roles[cur]=[]
            elif cur: roles[cur].append(html.unescape(m.group(2)))
    p['roles']=roles
    k=t.find('Specialities:'); ps=t[j:k]
    p['playstyles']=[html.unescape(a) for kind,a in re.findall(r"playstyles/(normal|plus)/[^']*' alt='([^']*)'",ps) if kind=='normal']
    p['playstylesPlus']=[html.unescape(a) for kind,a in re.findall(r"playstyles/(normal|plus)/[^']*' alt='([^']*)'",ps) if kind=='plus']
    # positions list
    m=re.search(r'Age:\n\d+\n((?:[A-Z]{2,3}(?: [A-Z]{2,3})*\n)+)OVR','\n'.join(lines))
    p['positions']=m.group(1).split() if m else []
    out.append(p); print(p.get('fullName'),p.get('ovr'),p.get('positions'),len(p.get('attr',{})),p['roles'],p['playstylesPlus'],file=sys.stderr)
json.dump(out,open(sys.argv[2],'w'),ensure_ascii=False,indent=1)
