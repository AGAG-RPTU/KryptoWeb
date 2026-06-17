from random import randint


print(" *** Visuelle Krypptographie ***")
print(" ")
print("Dieses Programm erzeugt aus einem schwarz-weißen PBM-Bild zwei Folien zum Übereinanderlegen")
print(" ")

datei=input("Dateiname der PBM-Datei, die im gleichen Verzeichnis liegt wie dieses Python-Skript: ")
datei=datei+".pbm"

f1=input("Dateiname der Folie 1 angeben. Diese wird im gleichen Verzeichnis gespeichert: ")
f1=f1+".pbm"
f2=input("Dateiname der Folie 2 angeben. Diese wird im gleichen Verzeichnis gespeichert: ")
f2=f2+".pbm"

#Listen erzeugen
Liste = []
Daten=[]
Liste1=[]
Liste2=[]

#Bilddatei einlesen
fobj = open(datei,"r")
c=0
for line in fobj:
    c=c+1
    if c==1:
        line1=line
    if c==2:
        line2=line
        for i in line:
            Daten.append(i)    
    if c>=2:
        for i in line:
            if i=="1" or i=="0":
                Liste.append(int(i))
fobj.close()

#Höhe und Breite auslesen
bstr=""
hstr=""
nr=1
for zeichen in Daten:
    if zeichen == " ":
        nr=2
    if nr == 1:    
        bstr=bstr+zeichen
    if nr == 2 and zeichen!="\n" and zeichen!=" ":    
        hstr=hstr+zeichen
breite=int(bstr)
hoehe=int(hstr)

print(" ")
print ("Das Originalbild hat folgende Daten:")
print ("Breite: ",breite)
print ("Höhe: ",hoehe)
print ("Die Folien haben folgende Daten:")
print ("Breite: ",breite*2)
print ("Höhe: ",hoehe*2)



# Folien berechnen        

for h in range (hoehe):
    for b in range (breite):
        z=randint(1,2)
        if Liste[h*(breite)+b]==0:
            if z==1:
                Liste1.insert(4*h*breite+b*2, 0)
                Liste1.insert(4*h*breite+b*2+1, 1)
                Liste1.insert (4*h*breite+2+b*4,1)
                Liste1.insert (4*h*breite+2+b*4+1,0)
                Liste2.insert(4*h*breite+b*2, 0)
                Liste2.insert(4*h*breite+b*2+1, 1)
                Liste2.insert (4*h*breite+2+b*4,1)
                Liste2.insert (4*h*breite+2+b*4+1,0)
            else:
                Liste1.insert(4*h*breite+b*2, 1)
                Liste1.insert(4*h*breite+b*2+1, 0)
                Liste1.insert (4*h*breite+2+b*4,0)
                Liste1.insert (4*h*breite+2+b*4+1,1)
                Liste2.insert(4*h*breite+b*2, 1)
                Liste2.insert(4*h*breite+b*2+1, 0)
                Liste2.insert (4*h*breite+2+b*4,0)
                Liste2.insert (4*h*breite+2+b*4+1,1)
        else:
            if z==1:
                Liste1.insert(4*h*breite+b*2, 0)
                Liste1.insert(4*h*breite+b*2+1, 1)
                Liste1.insert (4*h*breite+2+b*4,1)
                Liste1.insert (4*h*breite+2+b*4+1,0)
                Liste2.insert(4*h*breite+b*2, 1)
                Liste2.insert(4*h*breite+b*2+1,0)
                Liste2.insert (4*h*breite+2+b*4,0)
                Liste2.insert (4*h*breite+2+b*4+1,1)
            else:
                Liste1.insert(4*h*breite+b*2, 1)
                Liste1.insert(4*h*breite+b*2+1, 0)
                Liste1.insert (4*h*breite+2+b*4,0)
                Liste1.insert (4*h*breite+2+b*4+1,1)
                Liste2.insert(4*h*breite+b*2, 0)
                Liste2.insert(4*h*breite+b*2+1, 1)
                Liste2.insert (4*h*breite+2+b*4,1)
                Liste2.insert (4*h*breite+2+b*4+1,0)


line2=str(breite*2)+" "+str(hoehe*2)+"\n"

#Schreiben Folie 1
file = open(f1,"w") 
file.write(line1) 
file.write(line2)
for i in Liste1:
    file.write(str(i)) 
file.close() 

#Schreiben Folie 2
file = open(f2,"w") 
file.write(line1) 
file.write(line2)
for i in Liste2:
    file.write(str(i)) 
file.close()                 
            


