import { useChat } from '../hooks/useChat';

function MissYouButton() {
  const { sendMissYou, missYou } = useChat();

  return (
    <section className={'bg-white rounded-2xl shadow-sm border border-rose-100 p-5 flex flex-col items-center justify-center text-center'}>
      <h2 className={'text-lg font-semibold text-slate-700 mb-2'}>Send a little love</h2>
      <button
        onClick={sendMissYou}
        className={'px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-medium transition'}
      >
        Miss you ❤️
      </button>
      {missYou && (
        <p className={'mt-3 text-sm text-rose-600 animate-pulse'}>
          {missYou.from} sent a {'miss you'} ping!
        </p>
      )}
    </section>
  );
}

export default MissYouButton;
