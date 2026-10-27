import json
C={'GK':(0.5,0.04,'GK'),'LB':(0.12,0.21,'LB'),'RB':(0.88,0.21,'RB'),'LCB':(0.36,0.17,'CB'),'RCB':(0.64,0.17,'CB'),
'LCB3':(0.27,0.18,'CB'),'CB':(0.5,0.16,'CB'),'RCB3':(0.73,0.18,'CB'),'LWB':(0.08,0.3,'LWB'),'RWB':(0.92,0.3,'RWB'),'LWB5':(0.08,0.24,'LWB'),'RWB5':(0.92,0.24,'RWB'),
'CDM':(0.5,0.31,'CDM'),'LDM':(0.38,0.33,'CDM'),'RDM':(0.62,0.33,'CDM'),'CM':(0.5,0.42,'CM'),'LCM':(0.31,0.42,'CM'),'RCM':(0.69,0.42,'CM'),
'LCM2':(0.38,0.41,'CM'),'RCM2':(0.62,0.41,'CM'),'LM':(0.1,0.47,'LM'),'RM':(0.9,0.47,'RM'),'LM5':(0.1,0.5,'LM'),'RM5':(0.9,0.5,'RM'),
'CAM':(0.5,0.57,'CAM'),'LAM':(0.3,0.58,'CAM'),'RAM':(0.7,0.58,'CAM'),'LW':(0.12,0.66,'LW'),'RW':(0.88,0.66,'RW'),
'ST':(0.5,0.75,'ST'),'LS':(0.39,0.74,'ST'),'RS':(0.61,0.74,'ST'),'LAMW':(0.2,0.6,'CAM'),'RAMW':(0.8,0.6,'CAM')}
def F(id,name,slots,note=''):
    out=[]
    for s in slots:
        x,y,pos=C[s]; out.append(dict(id=s,pos=pos,x=x,y=y))
    return dict(id=id,name=name,note=note,slots=out)
B4=['GK','LB','LCB','RCB','RB']; B3=['GK','LCB3','CB','RCB3']; B5=['GK','LWB5','LCB3','CB','RCB3','RWB5']
L=[F('4-3-3','4-3-3',B4+['LCM','CM','RCM','LW','ST','RW'],'Плоская тройка CM'),
 F('4-3-3(2)','4-3-3 (2) — с опорником',B4+['CDM','LCM','RCM','LW','ST','RW']),
 F('4-3-3(4)','4-3-3 (4) — с CAM',B4+['LCM2','RCM2','CAM','LW','ST','RW']),
 F('4-2-3-1','4-2-3-1 (широкая)',B4+['LDM','RDM','LM','CAM','RM','ST'],'Схема Флика'),
 F('4-2-3-1(2)','4-2-3-1 (2) — узкая',B4+['LDM','RDM','LAM','CAM','RAM','ST']),
 F('4-1-4-1','4-1-4-1',B4+['CDM','LM','LCM','RCM','RM','ST']),
 F('4-4-2','4-4-2',B4+['LM','LCM2','RCM2','RM','LS','RS']),
 F('4-4-2(2)','4-4-2 (2) — два опорника',B4+['LM','LDM','RDM','RM','LS','RS']),
 F('4-1-2-1-2','4-1-2-1-2 (ромб)',B4+['CDM','LCM','RCM','CAM','LS','RS']),
 F('4-1-2-1-2(2)','4-1-2-1-2 (2) — широкий ромб',B4+['CDM','LM','RM','CAM','LS','RS']),
 F('4-2-2-2','4-2-2-2',B4+['LDM','RDM','LAMW','RAMW','LS','RS']),
 F('4-3-1-2','4-3-1-2',B4+['LCM','CM','RCM','CAM','LS','RS']),
 F('4-2-4','4-2-4',B4+['LCM2','RCM2','LW','LS','RS','RW']),
 F('4-4-1-1','4-4-1-1 (2)',B4+['LM','LCM2','RCM2','RM','CAM','ST']),
 F('3-4-3','3-4-3',B3+['LM','LCM2','RCM2','RM','LW','ST','RW']),
 F('3-4-2-1','3-4-2-1',B3+['LM','LCM2','RCM2','RM','LAM','RAM','ST']),
 F('3-5-2','3-5-2',B3+['LDM','RDM','LM','CAM','RM','LS','RS']),
 F('3-1-4-2','3-1-4-2',B3+['CDM','LM','LCM','RCM','RM','LS','RS']),
 F('5-3-2','5-3-2',B5+['LCM','CM','RCM','LS','RS']),
 F('5-2-1-2','5-2-1-2',B5+['LCM2','RCM2','CAM','LS','RS']),
 F('5-4-1','5-4-1',B5+['LM','LCM2','RCM2','RM','ST']),
 F('5-2-3','5-2-3',B5+['LCM2','RCM2','LW','ST','RW'])]
for f in L: assert len(f['slots'])==11,f['id']
# 3-at-back: LM/RM in 3-4-3 act as wingbacks in-game (positions LM/RM). Keep pos.
json.dump(dict(_meta=dict(note='Coordinates: x 0=left..1=right touchline, y 0=own goal..1=opponent goal. Base = defensive shape at Balanced line height. FC 26 has 29 formations in total; the main ones are included — you can add more (copy an entry, keep 11 slots). Positions use in-game codes; slot ids are unique per formation.',source='Formation names: EA FC 26 in-game list (fifauteam.com/fc-26-tactics, fut.gg tactics). Coordinates are approximations drawn by hand.'),formations=L),open('../data/formations.json','w'),ensure_ascii=False,indent=1)
print(len(L))
