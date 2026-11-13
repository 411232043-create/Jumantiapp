'use client';

import { useRef, useState } from 'react';

const SPEED = 1.0; // semakin besar = semakin lambat

/**
 * Tombol "Kirim" dengan animasi paper-plane 3 langkah
 * (adaptasi dari desain Send-Button-Animation — dihijaukan).
 * onSend: async () => boolean — true = sukses, false = gagal (tombol kembali idle).
 */
export function SendButton({ onSend, disabled, label = 'Kirim Laporan', doneText = 'Terkirim!' }) {
  const stage = useRef(null), body = useRef(null), pill = useRef(null), lbl = useRef(null),
    plane = useRef(null), back = useRef(null), arc = useRef(null), check = useRef(null),
    sent = useRef(null), sentText = useRef(null), ripple = useRef(null);
  const anims = useRef([]);
  const [state, setState] = useState('idle');

  const play = (el, frames, o) => {
    const k = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : SPEED;
    const a = el.animate(frames, {
      fill: 'forwards', easing: 'cubic-bezier(.45,0,.25,1)', ...o,
      duration: o.duration * k, delay: (o.delay || 0) * k,
    });
    anims.current.push(a);
    return a;
  };

  const reset = () => {
    anims.current.forEach((a) => a.cancel());
    anims.current = [];
    setState('idle');
    stage.current?.setAttribute('aria-label', label);
  };

  const send = async (e) => {
    setState('running');

    const r = pill.current.getBoundingClientRect();
    ripple.current.style.left = (e.detail ? e.clientX - r.left : r.width / 2) + 'px';
    ripple.current.style.top = (e.detail ? e.clientY - r.top : r.height / 2) + 'px';
    play(ripple.current, [
      { transform: 'translate(-50%,-50%) scale(.3)', opacity: .9 },
      { transform: 'translate(-50%,-50%) scale(1.8)', opacity: 0 },
    ], { duration: 450 });

    play(pill.current, [{ transform: 'scale(1)' }, { transform: 'scale(.95,.9)' }, { transform: 'scale(1)' }], { duration: 220 });
    play(lbl.current, [{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(.4)', opacity: 0 }], { delay: 80, duration: 260 });

    play(plane.current, [
      { transform: 'translate(-54px,0) rotate(0deg) scale(1)', color: 'var(--send-blue)', opacity: 1 },
      { transform: 'translate(-40px,-64px) rotate(8deg) scale(1.15)', color: '#ffffff', opacity: 1, offset: .4 },
      { transform: 'translate(130px,-150px) rotate(25deg) scale(.6)', color: '#ffffff', opacity: 0 },
    ], { delay: 100, duration: 520 });

    play(pill.current, [
      { width: '200px', height: '58px', borderRadius: '12px', transform: 'rotate(0deg)' },
      { width: '214px', height: '48px', borderRadius: '10px', transform: 'rotate(-7deg)', offset: .3 },
      { width: '112px', height: '72px', borderRadius: '30px', transform: 'rotate(7deg)', offset: .65 },
      { width: '76px', height: '76px', borderRadius: '38px', transform: 'rotate(0deg)' },
    ], { delay: 300, duration: 650 });

    play(back.current, [
      { transform: 'translate(120px,-90px) rotate(170deg) scale(.6)', opacity: 0 },
      { transform: 'translate(105px,-40px) rotate(185deg) scale(1)', opacity: 1, offset: .2 },
      { transform: 'translate(70px,45px) rotate(225deg) scale(1.15)', opacity: 1, offset: .5 },
      { transform: 'translate(0px,74px) rotate(300deg) scale(1.15)', opacity: 1, offset: .78 },
      { transform: 'translate(0px,26px) rotate(360deg) scale(.55)', opacity: 0 },
    ], { delay: 480, duration: 720 });
    play(arc.current, [
      { transform: 'rotate(-100deg)', opacity: 0 },
      { transform: 'rotate(20deg)', opacity: 1, offset: .35 },
      { transform: 'rotate(200deg)', opacity: 0 },
    ], { delay: 450, duration: 800 });

    play(check.current, [
      { transform: 'translateY(44px) rotate(-12deg) scale(.7)', opacity: 0 },
      { opacity: 1, offset: .25 },
      { transform: 'translateY(0) rotate(0deg) scale(1)', opacity: 1 },
    ], { delay: 1150, duration: 450, easing: 'cubic-bezier(.34,1.56,.64,1)' });

    play(pill.current, [
      { transform: 'scale(1)', borderRadius: '38px' },
      { transform: 'scale(1.14,.84)', borderRadius: '46% 54% 42% 58% / 58% 42% 58% 42%', offset: .25 },
      { transform: 'scale(.9,1.12)', borderRadius: '56% 44% 54% 46% / 44% 56% 44% 56%', offset: .5 },
      { transform: 'scale(1.05,.96)', borderRadius: '44% 56% 48% 52% / 52% 48% 56% 44%', offset: .75 },
      { transform: 'scale(1)', borderRadius: '38px' },
    ], { delay: 1100, duration: 700, easing: 'ease-in-out' });

    play(body.current, [{ transform: 'translateX(0)' }, { transform: 'translateX(-66px)' }],
      { delay: 1800, duration: 520, easing: 'cubic-bezier(.5,0,.2,1)' });
    play(sent.current, [
      { transform: 'translateX(19px) scaleX(0)' },
      { transform: 'translateX(19px) scaleX(1)' },
    ], { delay: 1800, duration: 520, easing: 'cubic-bezier(.5,0,.2,1)' });
    play(sentText.current, [{ opacity: 0, transform: 'translateX(-10px)' }, { opacity: 1, transform: 'translateX(0)' }],
      { delay: 2150, duration: 300 });

    const animDone = Promise.all(anims.current.map((a) => a.finished)).catch(() => {});
    const ok = await Promise.resolve(onSend()).catch(() => false);
    if (ok === false) { reset(); return; }
    await animDone;
    setState('done');
    stage.current?.setAttribute('aria-label', doneText);
  };

  const handleClick = (e) => {
    if (disabled) return;
    if (state === 'idle') send(e);
    else if (state === 'done') reset();
  };

  return (
    <button ref={stage} type="button" className="send-stage" aria-label={label} onClick={handleClick}
      style={disabled ? { opacity: .6, cursor: 'not-allowed' } : undefined}>
      <svg ref={arc} className="send-arc" viewBox="0 0 170 170" aria-hidden="true"><circle cx="85" cy="85" r="64" /></svg>
      <div ref={sent} className="send-sent" aria-hidden="true"><span ref={sentText}>{doneText}</span></div>
      <div ref={body} className="send-body">
        <div ref={pill} className="send-pill">
          <span ref={lbl} className="send-label">{label}</span>
          <svg ref={check} className="send-check" viewBox="0 0 24 24" aria-hidden="true"><path d="M5.4 12.3 10.1 17 18.7 7" /></svg>
          <span ref={ripple} className="send-ripple"></span>
        </div>
      </div>
      <svg ref={plane} className="send-plane" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 3 3 10.5l7.5 3 3 7.5z" /></svg>
      <svg ref={back} className="send-plane-back" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 21 21 12 16.5 3 21z" /><path className="crease" d="M12 6.5V15.5" /></svg>
    </button>
  );
}
