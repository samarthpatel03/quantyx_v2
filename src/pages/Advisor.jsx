import React, { useState } from 'react';
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card } from "../components/ui/card";

const Advisor = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hello! I am the Quantyx AI Advisor. How can I help you analyze the market today?' }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input;
    setInput('');
    // Add user's message to the chat
    setMessages((prev) => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      // Send message to your Flask backend
      const response = await fetch('http://localhost:5000/api/advisor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await response.json();

      if (response.ok) {
        // Add Gemini's response to the chat
        setMessages((prev) => [...prev, { role: 'assistant', text: data.reply }]);
      } else {
        console.error("Server error:", data.error);
        setMessages((prev) => [...prev, { role: 'assistant', text: 'Sorry, I encountered an error connecting to the market data.' }]);
      }
    } catch (error) {
      console.error("Network error:", error);
      setMessages((prev) => [...prev, { role: 'assistant', text: 'Sorry, the server is currently unreachable.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-4xl py-8">
      <h1 className="text-3xl font-bold mb-6 text-gradient-mint">Quantyx AI Advisor</h1>
      
      <Card className="flex flex-col h-[600px] p-4 glass">
        {/* Chat History */}
        <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2 no-scrollbar">
          {messages.map((msg, index) => (
            <div 
              key={index} 
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[80%] p-3 rounded-lg ${
                  msg.role === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-foreground border border-border'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted text-foreground p-3 rounded-lg border border-border animate-pulse">
                Thinking...
              </div>
            </div>
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about a stock ticker, market trend, or financial concept..."
            className="flex-1"
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            Send
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default Advisor;