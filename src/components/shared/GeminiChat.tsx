import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Bot, User, Sparkles, Zap, BrainCircuit, X, MessageSquare } from 'lucide-react';
import { ChatMessage, UserRole } from '../../types';
import { geminiService } from '../../services/geminiService';
import ReactMarkdown from 'react-markdown';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'motion/react';

interface GeminiChatProps {
  userRole: UserRole;
}

export function GeminiChat({ userRole }: GeminiChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFastMode, setIsFastMode] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const systemInstruction = `You are Hr AI, a helpful HR assistant. 
  The current user has the role: ${userRole}.
  You help users with employee management, policy questions, and general HR advice based on their role. 
  Be professional, concise, and empathetic. 
  If asked about specific employees, remind the user that you are an AI and they should verify details in the main dashboard.
  ${userRole === 'employee' ? 'As an employee, you can help them with policy questions, leave requests, and general workplace advice.' : ''}
  ${userRole === 'admin' || userRole === 'hr_manager' ? 'As an admin/HR manager, you can provide deeper insights into team management and compliance.' : ''}`;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      let response;
      if (isFastMode) {
        response = await geminiService.fastChat(input);
      } else {
        response = await geminiService.chat([...messages, userMessage], systemInstruction);
      }
      setMessages(prev => [...prev, { role: 'model', text: response || 'Sorry, I encountered an error.' }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: 'Failed to get a response from AI.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-20 right-6 z-50 w-[380px] shadow-2xl"
          >
            <Card className="flex flex-col h-[600px] border-border bg-card shadow-2xl overflow-hidden rounded-2xl">
              <CardHeader className="border-b border-border bg-muted/50 py-3 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                  <Sparkles className="h-4 w-4 text-primary" />
                  AI HR Assistant
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={cn(
                      "h-7 px-2 text-[10px] gap-1 font-semibold border transition-all",
                      isFastMode 
                        ? "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/20" 
                        : "bg-primary/10 text-primary hover:bg-primary/20 border-primary/20"
                    )}
                    onClick={() => setIsFastMode(!isFastMode)}
                  >
                    {isFastMode ? <Zap className="h-3 w-3" /> : <BrainCircuit className="h-3 w-3" />}
                    {isFastMode ? 'Fast Mode' : 'Pro Mode'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-0 overflow-hidden">
                <div className="h-[480px] p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-muted" ref={scrollRef}>
                  <div className="space-y-4">
                    {messages.length === 0 && (
                      <div className="text-center py-12 text-muted-foreground">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 border border-border">
                          <Bot className="h-8 w-8 opacity-40" />
                        </div>
                        <p className="text-sm font-medium text-foreground">How can I help you with HR today?</p>
                        <p className="text-xs opacity-60 mt-1">Ask about policies, onboarding, or team management.</p>
                      </div>
                    )}
                    {messages.map((m, i) => (
                      <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <Avatar className="h-8 w-8 border border-border">
                          <AvatarFallback className={m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}>
                            {m.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                          </AvatarFallback>
                        </Avatar>
                        <div className={cn(
                          "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm",
                          m.role === 'user' 
                            ? 'bg-primary text-primary-foreground rounded-tr-none' 
                            : 'bg-muted/50 border border-border text-foreground rounded-tl-none'
                        )}>
                          <div className="markdown-body prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown>{m.text}</ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    ))}
                    {loading && (
                      <div className="flex gap-3">
                        <Avatar className="h-8 w-8 border border-border">
                          <AvatarFallback className="bg-muted text-muted-foreground">
                            <Bot className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="bg-muted/50 border border-border rounded-2xl rounded-tl-none px-4 py-2.5 text-sm text-muted-foreground animate-pulse">
                          Thinking...
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="p-4 border-t border-border bg-muted/30">
                <div className="flex w-full gap-2">
                  <Input
                    placeholder="Ask about HR policies..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    disabled={loading}
                    className="bg-background border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
                  />
                  <Button 
                    size="icon" 
                    onClick={handleSend} 
                    disabled={loading}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground shrink-0"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        onClick={() => setIsOpen(!isOpen)}
        size="icon"
        className={cn(
          "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl z-50 transition-transform hover:scale-105",
          isOpen ? "bg-muted text-foreground hover:bg-muted/80" : "bg-primary text-primary-foreground hover:bg-primary/90"
        )}
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
      </Button>
    </>
  );
}
