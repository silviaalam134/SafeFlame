import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import './FirstAidChatbot.css';

const FAQS = [
  {
    title: 'Minor burn',
    advice: 'Cool the area under clean, cool running water for about 20 minutes. Remove nearby rings or tight items before swelling starts, and cover loosely with a clean, non-stick dressing. Do not use ice, butter, or toothpaste.'
  },
  {
    title: 'Second-degree burn',
    advice: 'Cool the burn with clean, cool running water and cover it loosely with a clean dressing. Do not break blisters or pull away stuck clothing. Arrange prompt medical assessment, especially if the area is larger than the person\'s palm or involves the face, hands, joints, or genitals.'
  },
  {
    title: 'Severe or large burn',
    advice: 'Call emergency services immediately. Do not remove clothing stuck to the skin. Keep the person warm, avoid applying creams or liquids to the burn, and watch their breathing until professional help arrives.'
  },
  {
    title: 'Smoke inhalation',
    advice: 'Move to fresh air only if it is safe and call emergency services for breathing trouble, coughing, hoarseness, confusion, or exposure in an enclosed fire. Keep the person upright and monitor their breathing. Symptoms can worsen after exposure.'
  },
  {
    title: 'Clothing on fire',
    advice: 'Stop, drop, and roll. Smother flames with a blanket only if safe, then cool any burns with clean, cool running water. Call emergency services for significant burns, breathing problems, or if flames were inhaled.'
  }
];

export const FirstAidAskSection = () => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const askQuestion = async (event) => {
    event.preventDefault();
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion || loading) return;

    setLoading(true);
    setAnswer('');
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/chatbot/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: trimmedQuestion })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'The assistant could not respond.');
      setAnswer(data.response);
    } catch (requestError) {
      setError(requestError.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="first-aid-page__ai-section" aria-labelledby="ai-heading">
      <div className="first-aid-page__section-heading">
        <div><h2 id="ai-heading">Ask AI</h2><p>Ask a question about burn or smoke-inhalation first aid.</p></div>
      </div>
      <form className="first-aid-page__ask-form" onSubmit={askQuestion}>
        <label htmlFor="first-aid-question">Your question</label>
        <div className="first-aid-page__input-row">
          <input id="first-aid-question" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="What should I do for a small burn?" maxLength="1000" />
          <button type="submit" disabled={loading || !question.trim()}>{loading ? 'Asking...' : 'Ask'}</button>
        </div>
      </form>
      {loading && <div className="first-aid-page__chat-bubble is-loading" role="status">Thinking...</div>}
      {answer && <div className="first-aid-page__chat-bubble"><p>{answer}</p><small>This is general information only. For serious injuries, seek immediate medical help.</small></div>}
      {error && <div className="first-aid-page__error" role="alert">{error}</div>}
    </section>
  );
};

const FirstAidChatbot = () => {
  const [selectedFaq, setSelectedFaq] = useState(null);

  let isAdmin = false;
  try {
    isAdmin = JSON.parse(localStorage.getItem('user') || 'null')?.role === 'admin';
  } catch (parseError) {
    isAdmin = false;
  }
  if (isAdmin) return <Navigate to="/admin" replace />;

  return (
    <main className="first-aid-page">
      <header className="first-aid-page__header">
        <p className="first-aid-page__eyebrow">SafeFlame first aid</p>
        <h1>Burn Injury Help</h1>
        <p>Quick practical guidance for fire-related burns and smoke exposure.</p>
      </header>

      <section className="first-aid-page__faq-section" aria-labelledby="faq-heading">
        <div className="first-aid-page__section-heading">
          <div><h2 id="faq-heading">Common situations</h2><p>Tap a card to view immediate first-aid steps.</p></div>
        </div>
        <div className="first-aid-page__faq-grid">
          {FAQS.map((faq, index) => (
            <article className={`first-aid-page__faq-card ${selectedFaq === index ? 'is-selected' : ''}`} key={faq.title}>
              <button type="button" onClick={() => setSelectedFaq(selectedFaq === index ? null : index)} aria-expanded={selectedFaq === index}>
                <span>{faq.title}</span><span aria-hidden="true">{selectedFaq === index ? '−' : '+'}</span>
              </button>
              {selectedFaq === index && <p>{faq.advice}</p>}
            </article>
          ))}
        </div>
      </section>

      <FirstAidAskSection />
    </main>
  );
};

export default FirstAidChatbot;
