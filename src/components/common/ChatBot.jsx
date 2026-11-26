import { useEffect, useRef, useState } from "react";
import "./ChatBot.css";
import { BACKEND_URL } from "../../config/api";

const API_URL = BACKEND_URL;

const questions = [
  {
    id: 1,
    question: "What is Rudraksh?",
  },
  {
    id: 2,
    question: "How can I become a member?",
  },
  {
    id: 3,
    question: "How can I volunteer?",
  },
  {
    id: 4,
    question: "What projects do you work on?",
  },
  {
    id: 5,
    question: "How can I donate?",
  },
  {
    id: 6,
    question: "Where are you located?",
  },
  {
    id: 7,
    question: "How can I contact you?",
  },
  {
    id: 8,
    question: "Can I work with Rudraksh?",
  },
];

function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);

  const [messages, setMessages] = useState([
    {
      id: "welcome",
      sender: "bot",
      text:
        "Hi! 👋 Welcome to Rudraksh. I'm the Rudraksh AI assistant. How can I help you today?",
    },
  ]);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef(null);

  /* =========================================
     AUTO SCROLL
  ========================================= */

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, isLoading]);

  /* =========================================
     SEND MESSAGE TO AI
  ========================================= */

  const sendMessageToAI = async (userMessage) => {
    const trimmedMessage = userMessage.trim();

    if (!trimmedMessage) {
      return;
    }

    if (isLoading) {
      return;
    }

    console.log("🤖 Sending message:", trimmedMessage);

    const userMessageObject = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: trimmedMessage,
    };

    setMessages((current) => [
      ...current,
      userMessageObject,
    ]);

    setInput("");
    setIsLoading(true);

    /* =========================================
       CREATE HISTORY
    ========================================= */

    const history = messages
      .filter((message) => message.id !== "welcome")
      .slice(-10)
      .map((message) => ({
        role:
          message.sender === "user"
            ? "user"
            : "assistant",
        content: message.text,
      }));

    /* =========================================
       ABORT REQUEST AFTER 30 SECONDS
    ========================================= */

    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, 30000);

    try {
      console.log(
        "🌐 Connecting to:",
        `${API_URL}/api/chat`
      );

      const response = await fetch(
        `${API_URL}/api/chat`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            message: trimmedMessage,
            history,
          }),

          signal: controller.signal,
        }
      );

      console.log(
        "📡 Backend status:",
        response.status
      );

      const data = await response.json();

      console.log(
        "🤖 AI response:",
        data
      );

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "AI request failed."
        );
      }

      setMessages((current) => [
        ...current,
        {
          id: `bot-${Date.now()}`,
          sender: "bot",
          text:
            data.reply ||
            "Sorry, I couldn't generate a response.",
        },
      ]);
    } catch (error) {
      console.error(
        "❌ Chatbot error:",
        error
      );

      let errorMessage =
        "Sorry, I'm having trouble connecting to the AI right now.";

      if (error.name === "AbortError") {
        errorMessage =
          "The AI took too long to respond. Please try again.";
      }

      setMessages((current) => [
        ...current,
        {
          id: `error-${Date.now()}`,
          sender: "bot",
          text: errorMessage,
        },
      ]);
    } finally {
      clearTimeout(timeout);

      setIsLoading(false);

      console.log(
        "✅ Chat request finished."
      );
    }
  };

  /* =========================================
     QUICK QUESTION
  ========================================= */

  const answerQuestion = (question) => {
    sendMessageToAI(question.question);
  };

  /* =========================================
     FORM SUBMIT
  ========================================= */

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!input.trim()) {
      return;
    }

    sendMessageToAI(input);
  };

  /* =========================================
     WHATSAPP
  ========================================= */

  const openWhatsApp = () => {
    const message = encodeURIComponent(
      "Hello Rudraksh Social & Cultural Organization, I have a question through your website."
    );

    window.open(
      `https://wa.link/tvck85?text=${message}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <>
      {/* =================================
          CHAT WINDOW
      ================================= */}

      {isOpen && (
        <div className="chatbot-window">

          {/* HEADER */}

          <div className="chatbot-header">

            <div className="chatbot-header-info">

              <div className="chatbot-avatar">
                R
              </div>

              <div>
                <strong>
                  Rudraksh AI
                </strong>

                <span>
                  AI support assistant
                </span>
              </div>

            </div>

            <button
              type="button"
              className="chatbot-close"
              onClick={() =>
                setIsOpen(false)
              }
              aria-label="Close chat"
            >
              ×
            </button>

          </div>

          {/* =================================
              MESSAGES
          ================================= */}

          <div className="chatbot-messages">

            {messages.map((message) => (
              <div
                key={message.id}
                className={`chatbot-message ${
                  message.sender === "user"
                    ? "chatbot-message-user"
                    : "chatbot-message-bot"
                }`}
              >
                {message.text}
              </div>
            ))}

            {isLoading && (
              <div className="chatbot-message chatbot-message-bot">
                Thinking...
              </div>
            )}

            <div ref={messagesEndRef} />

          </div>

          {/* =================================
              QUICK QUESTIONS
          ================================= */}

          <div className="chatbot-questions">

            <div className="chatbot-question-title">
              QUICK QUESTIONS
            </div>

            <div className="chatbot-question-list">

              {questions.map((question) => (
                <button
                  key={question.id}
                  type="button"
                  className="chatbot-question"
                  onClick={() =>
                    answerQuestion(question)
                  }
                  disabled={isLoading}
                >
                  {question.question}
                </button>
              ))}

            </div>

          </div>

          {/* =================================
              INPUT
          ================================= */}

          <form
            className="chatbot-input-area"
            onSubmit={handleSubmit}
          >

            <input
              type="text"
              placeholder={
                isLoading
                  ? "AI is thinking..."
                  : "Ask Rudraksh anything..."
              }
              value={input}
              onChange={(event) =>
                setInput(event.target.value)
              }
              disabled={isLoading}
              aria-label="Type your message"
            />

            <button
              type="submit"
              disabled={
                isLoading ||
                !input.trim()
              }
              aria-label="Send message"
            >
              →
            </button>

          </form>

          {/* =================================
              WHATSAPP
          ================================= */}

          <button
            type="button"
            onClick={openWhatsApp}
            style={{
              width: "100%",
              border: "none",
              background: "transparent",
              padding: "8px 12px 12px",
              cursor: "pointer",
              fontSize: "12px",
              textDecoration: "underline",
            }}
          >
            Need a human? Contact us on WhatsApp
          </button>

        </div>
      )}

      {/* =================================
          FLOATING BUTTON
      ================================= */}

      <button
        type="button"
        className={`chatbot-toggle ${
          isOpen
            ? "chatbot-toggle-open"
            : ""
        }`}
        onClick={() =>
          setIsOpen(
            (current) => !current
          )
        }
        aria-label={
          isOpen
            ? "Close chatbot"
            : "Open chatbot"
        }
      >
        {isOpen ? (
          <span className="chatbot-toggle-close">
            ×
          </span>
        ) : (
          <>
            <span className="chatbot-toggle-icon">
              💬
            </span>

            <span className="chatbot-toggle-text">
              Chat with us
            </span>
          </>
        )}
      </button>
    </>
  );
}

export default ChatBot;