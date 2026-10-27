import json,re,unicodedata
A=json.load(open('fifacm_fc26_barca_raw.json')); B=json.load(open('fifacm_fc26_new2627_raw.json'))
RU={'wojciech-szczesny':('Щенсны','Szczęsny',13),'robert-lewandowski':('Левандовски','Lewandowski',9),'marc-andre-ter-stegen':('тер Штеген','ter Stegen',1),
'joao-pedro-cavaco-cancelo':('Канселу','Cancelo',2),'andreas-christensen':('Кристенсен','Christensen',15),'frenkie-de-jong':('де Йонг','de Jong',21),
'marcus-rashford':('Рэшфорд','Rashford',14),'raphael-dias-belloli':('Рафинья','Raphinha',11),'ferran-torres-garcia':('Ферран','Ferran Torres',7),
'jules-kounde':('Кундэ','Koundé',23),'daniel-olmo-carvajal':('Ольмо','Olmo',20),'eric-garcia-martret':('Эрик Гарсия','Eric García',24),
'ignacio-pena-sotorres':('Пенья','Iñaki Peña',None),'pedro-gonzalez-lopez':('Педри','Pedri',8),'anssumane-fati':('Ансу Фати','Ansu Fati',None),
'ronald-araujo':('Араухо','Araujo',4),'joan-garcia-pons':('Жоан Гарсия','Joan García',1),'alejandro-balde-martinez':('Бальде','Balde',3),
'pablo-martin-paez-gavira':('Гави','Gavi',6),'roony-bardghji':('Бардгжи','Bardghji',19),'marc-casado-torras':('Касадо','Casadó',17),
'aron-yaakobishvili':('Якобишвили','Yaakobishvili',None),'fermin-lopez-marin':('Фермин','Fermín',16),'ander-astralaga-aranguren':('Астралага','Astralaga',None),
'lamine-yamal-nasraoui-ebana':('Ламин Ямаль','Lamine Yamal',10),'diego-kochen':('Кочен','Kochen',None),'pau-cubarsi-paredes':('Кубарси','Cubarsí',5),
'hector-fort-garcia':('Эктор Форт','Héctor Fort',32),'gerard-martin-langreo':('Жерар Мартин','Gerard Martín',18),'marc-bernal-casas':('Берналь','Bernal',22),
'andres-cuenca-cejudo':('Куэнка','Cuenca',None),'guillermo-fernandez-casino':('Гийе Фернандес','Guille Fernández',None),'antonio-fernandez-casino':('Тони Фернандес','Toni Fernández',None),
'alvaro-cortes-moyano':('Кортес','Cortés',None),'jofre-torrents-salvat':('Торрентс','Torrents',None),'xavi-espart-font':('Эспарт','Xavi Espart',12),
'tomas-noel-marques-morera':('Томас Маркес','Tomás Marqués',None),'rodrigo-hernandez-cascante':('Родри','Rodri',16),'gabriel-fernando-de-jesus':('Габриэл Жезус','Gabriel Jesus',9),
'karim-adeyemi':('Адейеми','Adeyemi',14),'anthony-gordon':('Гордон','Gordon',17),'241671':('Ливакович','Livaković',25)}
# EA launch OVR (Sept 2025) — sportskeeda/beebom reports of official reveal
LAUNCH={'Pedri':89,'Raphinha':89,'Lamine Yamal':89,'Lewandowski':88,'de Jong':87,'Koundé':87,'ter Stegen':86,'Olmo':85,'Szczęsny':84,'Gavi':83,'Ferran Torres':83,'Balde':83,'Araujo':83,'Cubarsí':83,'Joan García':83,'Fermín':80,'Christensen':80,'Casadó':79,'Eric García':79,'Gerard Martín':74,'Bernal':73,'Bardghji':69,'Rodri':90}
# 2026/27 real squad (fcbarcelona.com, 2 Sep 2026 numbers news)
REAL2627={'Joan García':1,'Szczęsny':13,'Livaković':25,'Cancelo':2,'Balde':3,'Cubarsí':5,'Xavi Espart':12,'Christensen':15,'Gerard Martín':18,'Koundé':23,'Eric García':24,
'Gavi':6,'Fermín':7,'Pedri':8,'Rodri':16,'Olmo':20,'de Jong':21,'Bernal':22,'Gabriel Jesus':9,'Lamine Yamal':10,'Raphinha':11,'Adeyemi':14,'Gordon':17,'Bardghji':19}
def face(a,gk=False):
    g=lambda k:a.get(k,0)
    if gk:
        return dict(DIV=g('GK Diving'),HAN=g('GK Handling'),KIC=g('GK Kicking'),REF=g('GK Reflexes'),SPD=round(.45*g('Acceleration')+.55*g('Sprint Speed')),POS=g('GK Positioning'))
    r=lambda x:int(round(x))
    return dict(PAC=r(.45*g('Acceleration')+.55*g('Sprint Speed')),
      SHO=r(.05*g('Att. Position')+.45*g('Finishing')+.2*g('Shot Power')+.2*g('Long Shots')+.05*g('Volleys')+.05*g('Penalties')),
      PAS=r(.2*g('Vision')+.2*g('Crossing')+.05*g('FK Acc.')+.35*g('Short Pass')+.15*g('Long Pass')+.05*g('Curve')),
      DRI=r(.1*g('Agility')+.05*g('Balance')+.35*g('Ball Control')+.45*g('Dribbling')+.05*g('Composure')),
      DEF=r(.3*g('Interceptions')+.1*g('Heading Acc.')+.3*g('Def. Awareness')+.2*g('Stand Tackle')+.1*g('Slide Tackle')),
      PHY=r(.05*g('Jumping')+.25*g('Stamina')+.5*g('Strength')+.2*g('Aggression')))
def norm_roles(rd):
    out={}
    for pos,lst in rd.items():
        out[pos]=[]
        for s in lst:
            m=re.match(r'(.*?)(\+\+|\+)$',s.strip())
            out[pos].append(dict(role=m.group(1).strip() if m else s, level=(2 if m and m.group(2)=='++' else 1)))
    return out
P=[]
for src,new in ((A,False),(B,True)):
    for p in src:
        slug=p['url'].rstrip('/').split('/')[-1]
        ru,en,num=RU[slug]
        gk=p['positions']==['GK']
        P.append(dict(id=re.sub(r'[^a-z0-9]+','-',unicodedata.normalize('NFKD',en).encode('ascii','ignore').decode().lower()).strip('-'),
          name=en,nameRu=ru,fullName=p['fullName'],number=REAL2627.get(en,num),age=p['age'],heightCm=p['height'],foot='L' if p['foot']=='Left' else 'R',
          skillMoves=p['sm'],weakFoot=p['wf'],positions=p['positions'],ovr=p['ovr'],ovrLaunch=LAUNCH.get(en),
          face=face(p['attr'],gk),attr=p['attr'],roles=norm_roles(p['roles']),playstyles=p['playstyles'],playstylesPlus=p['playstylesPlus'],
          inFc26Barca=not new,inReal2627=en in REAL2627,
          note=('FC 26 data from his FC 26 club (signed by Barça for 2026/27)' if new else ('Left the club before 2026/27' if en not in REAL2627 else '')),
          source=p['url']))
missing=[dict(name='Brian Fariñas',number=4,pos='MF',reason='Not found in FC 26 database (no FC 26 card found on fifacm/futbin search results)'),
 dict(name='Bisiwu',number=27,pos='FW',reason='Youth/new player, no FC 26 data found'),
 dict(name='Hamza Abdelkarim',number=29,pos='FW',reason='Not found in FC 26 database')]
meta=dict(game='EA SPORTS FC 26',dataSource='fifacm.com FC 26 live database (latest update 23 Jun 2026) — attributes, positions, roles+/++, PlayStyles/PlayStyles+',
 ovrLaunchSource='EA official FC 26 ratings reveal (Sept 2025) via sportskeeda.com / beebom.com articles',
 real2627Source='fcbarcelona.com first-team squad page + 2026/27 jersey numbers news (02 Sep 2026) + en.wikipedia.org/wiki/2026–27_FC_Barcelona_season',
 faceFormula='Face stats computed from detailed attributes with standard weights (verified against EA ratings page): PAC=.45Acc+.55Spr, SHO, PAS, DRI(approx.), DEF, PHY',
 notes=['Work rates are not used: since FC 25 they are replaced by Roles (FC IQ); fifacm shows Med/Med for everyone.','Ages are database ages (at game data date), not real current ages.','OVR is stored for display only — the danger rating NEVER uses OVR.'],
 missingFromFc26=missing)
json.dump(dict(_meta=meta,players=P),open('../data/players.json','w'),ensure_ascii=False,indent=1)
print(len(P),[x['id'] for x in P])
