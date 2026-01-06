import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";

const Message = ({ msg }) => {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  const isSuccess = msg.toLowerCase().includes("success") ||
                    msg.toLowerCase().includes("uploaded") ||
                    msg.toLowerCase().includes("processed") ||
                    msg.toLowerCase().includes("accepted") ||
                    msg.toLowerCase().includes("selected") ||
                    msg.toLowerCase().includes("corrected") ||
                    msg.toLowerCase().includes("cleared");

  // Auto-dismiss success messages after 4 seconds
  useEffect(() => {
    if (isSuccess) {
      const fadeTimer = setTimeout(() => setFading(true), 3500);
      const hideTimer = setTimeout(() => setVisible(false), 4000);
      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [msg, isSuccess]);

  // Reset visibility when message changes
  useEffect(() => {
    setVisible(true);
    setFading(false);
  }, [msg]);

  if (!visible) return null;

  // Success messages: smaller, inline toast style
  if (isSuccess) {
    return (
      <div
        className={`mb-3 flex items-center justify-center transition-opacity duration-500 ${fading ? 'opacity-0' : 'opacity-100'}`}
        role="status"
      >
        <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 text-sm rounded-full border border-green-200">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          {msg}
          <button
            type="button"
            className="ml-1 text-green-500 hover:text-green-700 focus:outline-none"
            onClick={() => setVisible(false)}
            aria-label="Dismiss"
          >
            &times;
          </button>
        </span>
      </div>
    );
  }

  // Error messages: more prominent
  return (
    <div className="p-3 mb-4 rounded-lg flex justify-between items-center bg-red-50 border border-red-300 text-red-700" role="alert">
      <div className="flex items-center gap-2">
        <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
        <span>{msg}</span>
      </div>
      <button
        type="button"
        className="ml-4 text-xl font-bold text-red-500 hover:text-red-700 focus:outline-none"
        onClick={() => setVisible(false)}
        aria-label="Close"
      >
        &times;
      </button>
    </div>
  );
};

Message.propTypes = {
  msg: PropTypes.string.isRequired,
};

export default Message;
