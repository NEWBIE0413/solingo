import asyncio, json, os, sys, hashlib
import edge_tts
course=json.load(open('courses/ja-kana.json'))
out='courses/ja-kana-audio'
texts=[k for k,v in course['items'].items() if not v.get('free')]+[w['t'] for w in course['words']]
def fn(t): return os.path.join(out, hashlib.md5(t.encode()).hexdigest()[:12]+'.mp3')
async def one(t, sem):
    p=fn(t)
    if os.path.exists(p) and os.path.getsize(p)>0: return
    async with sem:
        for attempt in range(3):
            try:
                await edge_tts.Communicate(t, 'ja-JP-NanamiNeural', rate='-10%').save(p); return
            except Exception as e:
                await asyncio.sleep(1.5*(attempt+1))
        print('FAIL', t, file=sys.stderr)
async def main():
    sem=asyncio.Semaphore(6)
    await asyncio.gather(*[one(t,sem) for t in texts])
    idx={t:os.path.basename(fn(t)) for t in texts if os.path.exists(fn(t))}
    json.dump(idx, open(os.path.join(out,'index.json'),'w'), ensure_ascii=False)
    print(len(idx),'/',len(texts))
asyncio.run(main())
