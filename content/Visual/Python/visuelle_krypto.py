from random import randint


def lies_pbm(datei):
    """Liest ein PBM-Bild als Text (P1) oder binär (P4); 1 = schwarz.

    Gibt Breite, Höhe und die Pixel zeilenweise als Liste zurück.
    """
    with open(datei, "rb") as f:
        daten = f.read()

    # Kopf: Kennung, Breite, Höhe; dazwischen Leerraum oder #-Kommentare
    teile = []
    pos = 0
    while len(teile) < 3:
        if daten[pos:pos+1].isspace():
            pos += 1
            continue
        if daten[pos:pos+1] == b"#":
            pos = daten.index(b"\n", pos)
            continue
        start = pos
        while not daten[pos:pos+1].isspace():
            pos += 1
        teile.append(daten[start:pos])
    kennung, breite, hoehe = teile[0], int(teile[1]), int(teile[2])
    pos += 1  # genau ein Leerzeichen trennt Kopf und Pixel

    if kennung == b"P1":
        pixel = [int(z) for z in daten[pos:].decode("ascii") if z in "01"]
    elif kennung == b"P4":
        # jede Bildzeile beginnt mit einem neuen Byte, 8 Pixel pro Byte
        bytes_pro_zeile = (breite + 7) // 8
        pixel = []
        for h in range(hoehe):
            zeile = daten[pos + h*bytes_pro_zeile : pos + (h+1)*bytes_pro_zeile]
            for b in range(breite):
                pixel.append((zeile[b // 8] >> (7 - b % 8)) & 1)
    else:
        raise SystemExit(datei + " ist keine PBM-Datei")

    return breite, hoehe, pixel


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
Liste1=[]
Liste2=[]

#Bilddatei einlesen
breite, hoehe, Liste = lies_pbm(datei)

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
file.write("P1\n") 
file.write(line2)
for i in Liste1:
    file.write(str(i)) 
file.close() 

#Schreiben Folie 2
file = open(f2,"w") 
file.write("P1\n") 
file.write(line2)
for i in Liste2:
    file.write(str(i)) 
file.close()                 
            


