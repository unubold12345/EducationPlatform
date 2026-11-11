"""Original SVG Writing visuals, with all data repeated in the candidate paper."""
from html import escape
from math import cos,sin,pi
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
COLORS=['#245b85','#b85b22','#477b49','#8053a0','#777777']

def label(x,y,text,size=18,anchor='start',fill='#18232c'):
    return f'<text x="{x}" y="{y}" font-size="{size}" text-anchor="{anchor}" fill="{fill}">{escape(str(text))}</text>'

def box(x,y,w,h,lines,color='#edf3f6'):
    out=f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="5" fill="{color}" stroke="#536573"/>'
    for i,t in enumerate(lines):out+=label(x+w/2,y+h/2-(len(lines)-1)*11+i*22,t,17,'middle')
    return out

def save(n,title,body,height=620):
    svg=f'<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="{height}" viewBox="0 0 1000 {height}" role="img"><title>{escape(title)}</title><rect width="1000" height="{height}" fill="white"/><g font-family="Arial, sans-serif">'+label(40,45,title,24)+body+'</g></svg>'
    p=ROOT/f'mock-{n:02d}'/'writing-1.svg';p.parent.mkdir(parents=True,exist_ok=True);p.write_text(svg+'\n',encoding='utf-8')

def charts():
    body=label(90,80,'Thousands of visits',16)
    for v in range(0,201,40):
        y=480-v*1.8;body+=f'<path d="M90 {y} H910" stroke="#d7dfe4"/>'+label(78,y+6,v,15,'end')
    xs=[90,295,500,705,910]
    for x,year in zip(xs,[2005,2010,2015,2020,2025]):body+=label(x,510,year,17,'middle')
    data=[('Under 18',[120,135,150,110,160]),('18–64',[180,170,145,100,125]),('65 and over',[60,75,95,90,120])]
    for i,(name,values) in enumerate(data):
        points=' '.join(f'{x},{480-v*1.8}' for x,v in zip(xs,values))
        body+=f'<polyline points="{points}" fill="none" stroke="{COLORS[i]}" stroke-width="4"/>'
        for x,v in zip(xs,values):body+=f'<circle cx="{x}" cy="{480-v*1.8}" r="5" fill="{COLORS[i]}"/>'
        body+=f'<path d="M{100+i*280} 565 h40" stroke="{COLORS[i]}" stroke-width="4"/>'+label(150+i*280,571,name,18)
    save(7,'Annual public-library visits in Branton, 2005–2025',body)
    body=''
    cats=['Housing','Food','Transport','Leisure','Other']
    for cx,year,values,total in [(270,2005,[25,30,20,15,10],1200),(730,2025,[35,20,15,20,10],2000)]:
        start=-pi/2
        for i,pct in enumerate(values):
            end=start+2*pi*pct/100
            x1,y1=cx+145*cos(start),255+145*sin(start);x2,y2=cx+145*cos(end),255+145*sin(end)
            body+=f'<path d="M{cx} 255 L{x1} {y1} A145 145 0 {int(pct>50)} 1 {x2} {y2} Z" fill="{COLORS[i]}" stroke="white" stroke-width="2"/>'
            mid=(start+end)/2;body+=label(cx+100*cos(mid),261+100*sin(mid),str(pct)+'%',18,'middle','white');start=end
        body+=label(cx,90,year,22,'middle')+label(cx,445,f'Total: {total:,} currency units/month',18,'middle')
    for i,cat in enumerate(cats):
        x=75+i*185;body+=f'<rect x="{x}" y="495" width="18" height="18" fill="{COLORS[i]}"/>'+label(x+25,511,cat,16)
    body+=label(500,570,'Shares of average household expenditure; nominal totals',17,'middle')
    save(8,'Household expenditure in Larton',body)
    body=label(40,90,'Rooms available, average occupancy and average length of stay',18)
    widths=[200,120,120,130,130,115,115];xs=[40]
    for w in widths:xs.append(xs[-1]+w)
    rows=[['Type','Rooms','Rooms','Occupancy','Occupancy','Stay','Stay'],['','2010','2025','2010','2025','2010','2025'],['Hotels','800','1,000','70%','68%','2.5','2.8'],['Guesthouses','300','250','60%','72%','3.0','3.5'],['Self-catering','400','900','55%','65%','5.0','4.2']]
    for j,row in enumerate(rows):
        for i,t in enumerate(row):
            x=xs[i];y=125+j*66
            body+=f'<rect x="{x}" y="{y}" width="{widths[i]}" height="66" fill="{"#edf3f6" if j<2 else "white"}" stroke="#9baab5"/>'+label(x+widths[i]/2,y+40,t,17,'middle')
    body+=label(40,505,'Stay: nights. Occupancy: occupied rooms as a share of available rooms.',17)
    save(9,'Visitor accommodation in Penford, 2010 and 2025',body)
    body='<defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto"><path d="M0 0 L7 3 L0 6" fill="#384e60"/></marker></defs>'
    nodes=[(60,95,['Collect used','cork stoppers']),(370,95,['Sort input']),(680,95,['Wash accepted','cork']),(680,255,['Dry with','warm air']),(370,255,['Grind into','granules']),(60,255,['Mix with','binder']),(60,440,['Press with heat','and pressure']),(370,440,['Inspect panels']),(680,440,['Pack and sell','suitable panels'])]
    for x,y,lines in nodes:body+=box(x,y,220,75,lines)
    for x1,y1,x2,y2 in [(280,132,370,132),(590,132,680,132),(790,170,790,255),(680,292,590,292),(370,292,280,292),(170,330,170,440),(280,477,370,477),(590,477,680,477)]:body+=f'<path d="M{x1} {y1} L{x2} {y2}" fill="none" stroke="#384e60" stroke-width="2" marker-end="url(#arrow)"/>'
    body+=box(370,195,220,40,['Non-cork: leave process'],'#fbe8dc')+f'<path d="M480 170 V195" stroke="#384e60" marker-end="url(#arrow)"/>'
    body+=label(390,378,'Unsuitable panels → grind again',16)+f'<path d="M480 440 V330" fill="none" stroke="#384e60" stroke-width="2" marker-end="url(#arrow)"/>'
    body+=label(40,225,'Binder input ↓',17)+label(500,570,'Proposed process. No numerical conditions are specified.',17,'middle')
    save(10,'Used cork stoppers → floor panels',body)
    body=label(955,90,'N ↑',20,'end')
    for offset,year in [(40,2005),(530,2025)]:
        body+=label(offset+215,90,year,24,'middle')+f'<rect x="{offset}" y="110" width="430" height="380" fill="#f7fafb" stroke="#445966" stroke-width="2"/>'
        body+=box(offset+20,135,150,85,['Car park'] if year==2005 else ['Community','garden'],'#e4ebdf')
        body+=box(offset+275,135,135,85,['Shops'])
        if year==2025:body+=box(offset+180,135,85,85,['Market','pavilion'])
        body+=f'<rect x="{offset}" y="260" width="430" height="55" fill="{"#d1d5d8" if year==2005 else "#e8dec4"}"/>'+label(offset+215,293,'Vehicle road' if year==2005 else 'Pedestrian path',18,'middle')
        body+=box(offset+20,355,170,85,['Bus stop'] if year==2005 else ['Café / outdoor','seating'])+box(offset+270,355,140,85,['Public toilets'])
        body+=label(offset+215,470,'West and east '+('vehicle' if year==2005 else 'pedestrian')+' entrances',14,'middle')
        body+=f'<rect x="{offset}" y="495" width="430" height="65" fill="#d1d5d8"/>'+label(offset+250,535,'Main Road',18,'middle')
        if year==2025:body+=box(offset+20,505,115,42,['Bus stop'],'#fff3d0')
    body+=label(500,603,'Same boundaries and orientation; plans are not to scale.',17,'middle')
    save(11,'Market Square, Elwick',body,640)
    body=label(65,85,'Percentage of adults',17)
    for v in range(0,51,10):
        y=450-v*6;body+=f'<path d="M80 {y} H950" stroke="#d7dfe4"/>'+label(67,y+5,v,16,'end')
    names=['In-person classes','Live online classes','Recorded courses','Printed self-study']
    for i,(name,a,b) in enumerate(zip(names,[35,10,20,40],[30,40,45,25])):
        x=145+i*210
        for dx,v,c in [(0,a,COLORS[0]),(65,b,COLORS[1])]:body+=f'<rect x="{x+dx}" y="{450-v*6}" width="52" height="{v*6}" fill="{c}"/>'+label(x+dx+26,440-v*6,str(v)+'%',17,'middle')
        body+=label(x+58,485,name,16,'middle')
    body+=label(340,535,'■ 2015',19,fill=COLORS[0])+label(525,535,'■ 2025',19,fill=COLORS[1])+label(500,580,'Multiple responses permitted. Weekly study time appears in the accompanying table.',17,'middle')
    save(12,'Methods adults used to learn a new skill in Norwick',body)

if __name__=='__main__':charts()
