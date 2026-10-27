import re,html,subprocess,json,time
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36"
slugs=re.findall(r'href="/roles/([a-z0-9_]+)"',open('/tmp/fcc.html').read()); slugs=sorted(set(slugs))
out={}
for s in slugs:
    t=subprocess.run(['curl','-s','-A',UA,'https://www.fccareer.ai/roles/'+s],capture_output=True,text=True).stdout
    tx=re.sub(r'<script.*?</script>|<style.*?</style>','',t,flags=re.S)
    tx=html.unescape(re.sub(r'<[^>]+>','\n',tx)); L=[x.strip() for x in tx.split('\n') if x.strip()]
    r={'url':'https://www.fccareer.ai/roles/'+s}
    try:
        i=L.index('Position'); j=L.index('Focus options',i)
        rows=[]; k=j+1
        while k<len(L) and re.fullmatch(r'[A-Z]{2,3}',L[k]):
            pos=L[k]; k+=1; fs=[]
            while k<len(L) and not re.fullmatch(r'[A-Z]{2,3}',L[k]) and L[k] not in ('What each focus changes',) and len(fs)<6 and not L[k].startswith('###'):
                fs.append(L[k]); k+=1
            rows.append((pos,fs))
        r['positions']=rows
    except Exception as e: r['err']=str(e)
    for key in ['In possession','Out of possession','The cost','Why you pick it']:
        if key in L:
            i=L.index(key); r[key]=L[i+1:i+4]
    if 'What each focus changes' in L:
        i=L.index('What each focus changes'); r['focusChanges']=L[i+1:i+8]
    if 'Attributes to scout for' in L:
        i=L.index('Attributes to scout for'); r['attrs']=L[i+1:i+6]
    m=re.search(r'Scout for ([^.]*)\.',tx); r['scout']=m.group(1) if m else None
    out[s]=r; time.sleep(0.3)
json.dump(out,open('fccareer_roles_raw.json','w'),ensure_ascii=False,indent=1)
for s,r in out.items(): print(s, r.get('positions'), '| scout:', r.get('scout'))
