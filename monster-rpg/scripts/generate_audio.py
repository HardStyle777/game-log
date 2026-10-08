"""Original scored, loopable retro RPG music and effects; no external audio samples."""
import numpy as np, wave, subprocess, pathlib, json
OUT=pathlib.Path(__file__).resolve().parents[1]/'dist/audio'; OUT.mkdir(exist_ok=True)
SR=22050
rng=np.random.default_rng(512)
def note(midi,duration,vol=.3,kind='lead'):
    n=max(1,int(SR*duration));t=np.arange(n)/SR;f=440*2**((midi-69)/12)
    if kind=='bass': y=np.sin(2*np.pi*f*t)+.2*np.sin(4*np.pi*f*t)
    elif kind=='bell':y=np.sin(2*np.pi*f*t)+.3*np.sin(6*np.pi*f*t)*np.exp(-t*5)
    elif kind=='pad':y=np.sin(2*np.pi*f*t)+.15*np.sin(4*np.pi*f*t)
    else:y=.62*np.sin(2*np.pi*f*t)+.24*np.sin(6*np.pi*f*t)+.14*np.sin(10*np.pi*f*t)
    attack=np.minimum(1,t/.012);release=np.minimum(1,(duration-t)/.045);env=attack*np.maximum(0,release)
    if kind=='bell':env*=np.exp(-t*2.5)
    return y*env*vol

def add(track,midi,at,dur,vol=.2,kind='lead',pan=0):
    v=note(midi,dur,vol,kind);p=int(at*SR);n=min(len(v),len(track)-p)
    if n<=0:return
    track[p:p+n,0]+=v[:n]*np.sqrt((1-pan)/2);track[p:p+n,1]+=v[:n]*np.sqrt((1+pan)/2)

def encode(name,track):
    peak=np.max(np.abs(track));track=np.tanh(track/max(1,peak)*1.3)*.8
    wav=OUT/(name+'.wav')
    with wave.open(str(wav),'wb')as w:w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes((track*32767).astype('<i2').tobytes())
    subprocess.run(['ffmpeg','-y','-loglevel','error','-i',str(wav),'-codec:a','libmp3lame','-b:a','96k',str(OUT/(name+'.mp3'))],check=True)
    wav.unlink()

def music(name,bpm,chords,melody,loops=2,battle=False):
    beat=60/bpm;bars=len(chords)*loops;track=np.zeros((int((bars*4*beat)*SR),2))
    for bar in range(bars):
        root=chords[bar%len(chords)];start=bar*4*beat
        for semitone in [0,3 if root in [45,50,57] else 4,7]:add(track,root+12+semitone,start,beat*3.9,.09,'pad',-.25)
        for b in range(4):
            add(track,root-(0 if b%2==0 else -7),start+b*beat,beat*.8,.17,'bass')
            for half in range(2):add(track,root+24+[0,7,12,7][(b*2+half)%4],start+(b+half/2)*beat,beat*.4,.06,'bell',.6)
            if battle:
                at=int((start+b*beat)*SR);n=int(.065*SR);noise=rng.normal(0,.025,n)*np.exp(-np.arange(n)/SR*60);track[at:at+n]+=noise[:,None]
        line=melody[bar%len(melody)]
        for i,m in enumerate(line):
            if m:add(track,m,start+i*beat/2,beat*(.42 if i<len(line)-1 else .46),.23,'lead',-.1)
    encode(name,track)

music('field',108,[48,55,57,53],[[72,76,79,76,74,72,67,69],[71,74,79,81,79,74,71,67],[69,72,76,79,76,72,74,76],[77,76,74,72,69,67,69,71]],loops=4)
music('battle',144,[45,53,50,52],[[69,72,76,72,79,76,72,76],[77,76,72,69,72,76,77,79],[74,77,81,77,79,77,74,72],[76,80,83,80,76,74,72,68]],loops=4,battle=True)
music('ending',90,[48,53,55,48],[[72,0,76,79,84,79,76,0],[77,0,79,81,84,81,79,77],[79,0,83,86,84,83,79,0],[84,0,79,76,72,0,0,0]],loops=2)
for name,notes in {'capture':[72,76,79,84],'victory':[67,72,76,79,84,84],'heal':[72,74,76,79,84],'evolve':[60,64,67,72,76,79,84],'step':[48],'attack':[64,55],'skill':[84,79,72],'defeat':[64,60,55,48],'click':[76]}.items():
    duration=.13 if name not in ['victory','evolve','defeat'] else .2
    tr=np.zeros((int((len(notes)*duration+.25)*SR),2))
    for i,m in enumerate(notes):add(tr,m,i*duration,duration*1.2,.35,'bell' if name in ['capture','heal','evolve','click']else'lead')
    encode(name,tr)
(OUT/'credits.json').write_text(json.dumps({'composer':'Original procedural composition for Lumina Island','source':'scripts/generate_audio.py','sample_rate':SR,'tracks':['field','battle','ending'],'effects':['capture','victory','heal','evolve','step','attack','skill','defeat','click']},ensure_ascii=False,indent=2))
print('Generated 3 original music tracks and 9 effects.')
