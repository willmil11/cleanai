# Deprecated versions
## Why
They're old and less efficient, I'm too lazy to update them to the latest features.

## What file is what
- app.py: That's the original version
- app.js That's the original port of the python version to js

## Efficiency?
Both of those still use their native float types aka 64 bit floats which consume an awful lot of memory, so I got gemini to convert the faster js port to use 32 bit floats without changing anything else and then I built all the new features on top of that one and I'm too lazy to update the old ones so I put them here.

## Why not just delete them
I would feel bad because I took a lot of time making them.