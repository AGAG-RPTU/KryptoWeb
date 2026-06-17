#import sympy
import random
import math

def text_to_num(a):
    v = 0
    for i in range(0, len(a)):
        v = v*256 + ord(a[i])
    return v


def num_to_text(n):
    a = ""
    while n > 0:
        a = chr(n % 256) + a
        n = n // 256
    return a

def gcd(a,b):
    while b != 0:
        c = a % b
        a = b
        b = c
    return a

def gcdex(a, b):
    A = a
    B = b
    e = 1 
    f = 0  # so a = e*a + f*b
    x = 0
    y = 1  #    b = x*a + y*b
    while b != 0:
      q = a//b
      c = a-q*b
      a = b
      b = c
      # c = e*a + (f-q)*b
      e, f, x, y = x, y, e-q*x, f-q*y
      #we should have a = e*A + f*B
      #and            b = x*A + y*B
      #always..
    return a, e, f     

#recursive implementation
def power(a, n):
    if n == 0:
        return 1
    if n == 1:
        return a

    b = power(a, n//2)**2
    if n % 2 == 1:
        return b*a
    else:
        return b

def power_mod(a, e, N):
  if e == 0:
      return 1
  if e == 1:
      return a % N

  b = (power_mod(a, e//2, N)**2) % N
  if e % 2 == 1:
      return (b*a) %N
  else:
      return b

#non-recursive, handles larger numbers.
def power_nc(a, e):
    b = a
    c = 1
    #b will run through the powers of a
    #e % 2 will run through the bits of e
    #in c we'll multiply the powers with the 1s
    while e > 0:
        if e % 2 == 1:
            c *= b
        b *= b
        e = e//2
    return c

def power_mod_nc(a, e, N):
    b = a
    c = 1
    while e > 0:
        if e % 2 == 1:
            c = (c*b) % N
        b = (b*b) % N
        e = e//2
    return c

#Miller-Rabin test
def isprime(p):
    assert p > 0
    if p == 1:
        return false
    if p < 4:
        return true
    pm1 = p-1
    s = 0
    while pm1 % 2 == 0:
        pm1 = pm1 // 2
        s += 1

    for i in range(1, 10):
        a = random.randrange(2, p)
        if gcd(a, p) > 1:
            return False

        a = power_mod_nc(a, pm1, p)
        if a == 1 or a == p-1:
            continue
        for j in range(1, s):
            a = (a*a) % p
            if a == p-1:
                break
        if a == 1 or a == p-1:
            continue
        else:
            return False
    return True

def next_prime(p):
    p += 1
    p += 1-(p%2)
    while not isprime(p):
        p += 2
    return p

n = int(input("number of bits in p and q: "))
p = next_prime(2**n)
if n > 20:
    q = next_prime(2**n + 2**(n-10))
else:
    q = next_prime(q)

N = p*q
e = 3
while gcd(e, (p-1)*(q-1)) > 1:
    e += 2

f = gcdex(e, (p-1)*(q-1))[1]

print("using N =", N)
print("and   e =", e)

t = input("Text to hide: ")

if len(t) >= math.log(N, 256): 
    raise NameError("string is too long for given parameters")


s = power_mod_nc(text_to_num(t), e, N)  #but pow(a,b,c) also works...

print("encrypted: ", s)

c = num_to_text(power_mod_nc(s, f, N))

print("decrypted: ", c)


