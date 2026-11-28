# R59 fitted outer coat/boot art. Run from fantasy-rpg: python tools/generate-fia-outfit-r59.py .
# Requires Pillow and numpy. Input artwork already keyed/normalized. Output is a separate layer atlas.
from PIL import Image
import numpy as np
from pathlib import Path
import sys
root=Path(sys.argv[1] if len(sys.argv)>1 else '.')
output=Path(sys.argv[2]) if len(sys.argv)>2 else root/'assets/r59/fia-outfit.png'
asset=Image.open(root/'assets/r59/fia-outfit-parts.png').convert('RGBA')
assert asset.size==(256,128)
parts=[asset.crop((0,0,96,128)),asset.crop((96,0,192,128)),asset.crop((192,0,256,96))]
coat=[(135,128,58,66,0,0),(117,130,52,60,-12,0),(124,151,51,45,-28,0),(130,153,49,41,-82,0),(120,144,50,56,-19,0),(137,133,58,62,-5,0),(142,132,56,54,-16,0),(132,143,56,51,-23,0),(143,130,49,58,-12,0),(129,129,57,59,-5,0),(132,130,56,59,0,0),(128,133,50,58,0,0),(129,142,50,47,-15,0),(133,131,55,60,0,0),(124,122,45,66,0,0),(124,120,45,64,0,0),(124,121,45,65,0,0)]
boots=[[(96,166,18,38,24,0),(173,165,19,37,-26,1)],[(99,165,18,38,12,0),(146,167,18,37,-15,1)],[(165,172,23,26,-60,1)],[(181,157,21,36,-88,1)],[(108,169,19,35,0,0)],[(105,166,18,39,25,0),(174,166,19,37,-26,1)],[(105,166,19,39,6,0),(203,170,18,38,-40,1)],[(110,165,19,39,2,0),(178,172,18,32,-35,1)],[(105,166,18,38,20,0),(174,166,18,37,-25,1)],[(95,165,18,39,20,0),(164,166,18,38,-25,1)],[(103,166,18,38,20,0),(165,166,18,38,-25,1)],[(94,166,18,38,19,0),(165,166,18,38,-20,1)],[(97,167,18,38,12,0),(163,169,18,36,-25,1)],[(108,166,18,38,16,0),(163,167,18,36,-20,1)],[(111,166,17,43,0,0),(151,166,17,43,0,1)],[(104,167,18,42,12,0),(154,167,18,42,-12,1)],[(110,166,17,43,0,0),(151,166,17,43,0,1)]]
field_coat=[(48,55,24,31,0,0)]*4+[(48,55,19,30,0,0),(47,56,19,30,-6,0),(48,56,19,30,4,0),(48,55,19,30,0,0)]+[(48,55,25,31,0,1)]*4+[(48,55,19,30,0,0),(48,56,19,30,5,0),(48,56,19,30,-4,0),(48,55,19,30,0,0)]
field_boot=[[(42,76,9,24,0,0),(55,76,9,24,0,1)],[(46,76,10,24,0,0)],[(48,76,10,24,0,0)],[(48,76,10,24,0,0)],[(49,75,13,24,0,1)],[(39,77,11,21,25,1),(58,76,11,22,-20,1)],[(35,72,11,22,48,1),(52,77,12,21,0,1)],[(34,76,11,22,30,1),(57,76,12,22,-28,1)],[(42,76,9,24,0,0),(55,76,9,24,0,1)],[(44,76,10,24,0,0),(52,72,9,18,0,1)],[(48,77,10,22,0,0)],[(44,76,10,23,0,0),(52,72,9,18,0,1)],[(47,76,13,23,0,0)],[(37,76,11,22,25,0),(56,77,11,21,-24,0)],[(43,77,11,23,0,0),(61,71,10,21,-55,0)],[(34,76,11,22,25,0),(57,77,11,22,-30,0)]]
move_coat=[(48,57,24,31,0,0),(48,59,24,30,0,0),(48,57,24,31,0,0),field_coat[0],(46,58,21,30,23,0),(47,61,21,30,25,0),(47,57,21,30,20,0),field_coat[4],(48,57,25,31,0,1),(48,57,25,31,0,1),(48,57,25,31,0,1),field_coat[8],(48,56,21,30,-23,0),(48,59,21,30,-25,0),(48,56,21,30,-20,0),field_coat[12]]
move_boot=[[(48,76,10,24,0,0)],[(48,76,10,24,0,0)],[(48,76,10,24,0,0)],field_boot[0],[(29,78,11,24,43,1),(53,74,11,22,-12,1)],[(29,78,11,24,42,1),(54,77,11,22,-30,1)],[(31,72,11,22,65,1),(57,78,12,24,0,1)],field_boot[4],[(49,77,10,23,0,0)],[(48,76,10,23,0,0)],[(48,77,10,23,0,0)],field_boot[8],[(43,74,11,22,15,0),(67,78,11,24,-46,0)],[(43,75,11,22,15,0),(65,78,11,24,-45,0)],[(43,78,11,24,0,0),(64,73,11,23,-65,0)],field_boot[12]]
def fitted(spec,part,size):
 x,y,w,h,ang,flip=spec;pic=parts[part].resize((w,h),Image.Resampling.LANCZOS)
 if (part==2 and flip) or (part==0 and flip):pic=pic.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
 pic=pic.rotate(-ang,Image.Resampling.BICUBIC,expand=True);ar=np.array(pic);ar[:,:,3]=np.where(ar[:,:,3]>=128,255,0);ar[ar[:,:,3]==0,:3]=0
 # tone the new gold down to the same contrast as the approved originals
 r,g,b,a=ar.astype(int).transpose(2,0,1); gold=(r>140)&(r>g)&(g>b+15)&(a>0)
 ar[gold,:3]=(ar[gold,:3].astype(float)*.88).round().astype('uint8')
 o=Image.new('RGBA',size);o.alpha_composite(Image.fromarray(ar,'RGBA'),(round(x-pic.width/2),round(y-pic.height/2)));return np.array(o)
def fitted_layers(cell,c,bs,i,small=False,back=False):
 src=np.array(cell);r,g,b,a=src.astype(int).transpose(2,0,1);Y,X=np.indices(a.shape)
 steel=(np.minimum(np.minimum(r,g),b)>55)&(np.maximum(np.maximum(r,g),b)-np.minimum(np.minimum(r,g),b)<42)
 skin=(r>125)&(r>g+22)&(g>b+8)&(g>68)&(r-g<105)&(g-b<100)
 coatlay=fitted(c,1 if c[5] else 0,cell.size)
 protect=(a>0)&(steel|((Y<c[1]-c[3]*.17)&skin))
 if not small and i in [8,11,12]:protect|=(a>0)&(Y<c[1]-3)
 if not small and i in [2,3,4]:protect|=(a>0)&skin
 if small:protect|=(a>0)&skin&(Y<c[1]+2);protect|=(Y<40)
 # Prone/side-running silhouettes need the greatest occlusion protection.
 if small or i in [2,3,4,8,11,12]:protect|=(a==0)
 # protect forearms outside chest center, especially attack poses
 protect|=(a>0)&(Y<c[1]-c[3]*.05)&(np.abs(X-c[0])>c[2]*.30)
 coatlay[protect]=0
 bootlay=Image.new('RGBA',cell.size)
 for bspec in bs:
  lay=fitted(bspec,2,cell.size)
  # retain grounded toe silhouette and prevent protruding boots in bent/KO poses.
  # The new shaft covers the existing shin, but original silhouette/steel remains untouched.
  protectb=(a==0)|steel
  if small:protectb|=(Y<65)
  # keep the green outer-coat tails distinct from the footwear
  protectb|=(g>r+7)&(g>b+7)&(a>0)
  lay[protectb]=0;bootlay.alpha_composite(Image.fromarray(lay,'RGBA'))
 return Image.fromarray(coatlay,'RGBA'),bootlay

inputs=[('assets/r37/fia-sprite.png',0),('assets/r41/fia-recovery.png',1),('assets/r45/fia-attack.png',5),('assets/r46/fia-guard-victory.png',11)]
W,H=1440,1032
layers=[Image.new('RGBA',(W,H)),Image.new('RGBA',(W,H))]
for name,offset in inputs:
 im=Image.open(root/name).convert('RGBA')
 for k in range(im.width//240):
  j=offset+k;cell=im.crop((k*240,0,(k+1)*240,216));co,bo=fitted_layers(cell,coat[j],boots[j],j)
  x=j%6*240;y=j//6*216;layers[0].alpha_composite(co,(x,y));layers[1].alpha_composite(bo,(x,y))
for ns,cs,bs,dx in [('assets/r42/fia-field.png',field_coat,field_boot,0),('assets/r43/fia-motion.png',move_coat,move_boot,384)]:
 im=Image.open(root/ns).convert('RGBA')
 for i in range(16):
  x=i%4*96;y=i//4*96;cell=im.crop((x,y,x+96,y+96));co,bo=fitted_layers(cell,cs[i],bs[i],i,True)
  layers[0].alpha_composite(co,(dx+x,648+y));layers[1].alpha_composite(bo,(dx+x,648+y))
packed=Image.new('RGBA',(W,H*2));packed.alpha_composite(layers[0],(0,0));packed.alpha_composite(layers[1],(0,H));packed.save(output,optimize=True)
