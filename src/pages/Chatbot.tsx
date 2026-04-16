import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, Bot, User, Loader2, Sparkles, Lightbulb, GraduationCap, UserCircle, ArrowRight, Settings } from "lucide-react";
import { cn } from "../utils/cn";
import { GoogleGenAI } from "@google/genai";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { db, auth } from "../firebase";
import { Link } from "react-router-dom";

interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
}

// Hàm trích xuất ngữ cảnh (Mini-RAG)
function retrieveRelevantContext(query: string, text: string, topK = 5): string {
  if (!text) return "";
  const keywords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const chunks = text.split(/\n\n+/).filter(c => c.trim().length > 0);
  if (chunks.length <= topK) return text;
  
  const scored = chunks.map(chunk => {
    const chunkLower = chunk.toLowerCase();
    let score = 0;
    keywords.forEach(kw => {
      if (chunkLower.includes(kw)) score++;
    });
    return { text: chunk, score };
  });
  
  scored.sort((a, b) => b.score - a.score);
  const relevant = scored.filter(s => s.score > 0).slice(0, topK);
  
  if (relevant.length === 0) {
    return chunks.slice(0, topK).join('\n...\n');
  }
  return relevant.map(s => s.text).join('\n...\n');
}

const SUGGESTED_PROMPTS = [
  "Tài sản cố định là gì?",
  "Định khoản mua hàng hóa chưa thanh toán?",
  "Bảng cân đối kế toán gồm những gì?",
];

export function Chatbot() {
  const [studentName, setStudentName] = useState("");
  const [isJoined, setIsJoined] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [user, setUser] = useState<FirebaseUser | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Kiểm tra xem học sinh đã nhập tên trước đó chưa (lưu trong session)
  useEffect(() => {
    const savedName = sessionStorage.getItem("eduquest_student_name");
    if (savedName) {
      setStudentName(savedName);
      setIsJoined(true);
      setMessages([
        {
          id: "1",
          role: "ai",
          content: `Chào ${savedName}! 👋 Tớ là Gia sư AI EduQuest. Tớ đã học thuộc tài liệu của thầy cô rồi. Cậu có câu hỏi nào cần tớ giải đáp không?`
        }
      ]);
    }
  }, []);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    
    const name = nameInput.trim();
    setStudentName(name);
    setIsJoined(true);
    sessionStorage.setItem("eduquest_student_name", name);
    
    setMessages([
      {
        id: "1",
        role: "ai",
        content: `Chào ${name}! 👋 Tớ là Gia sư AI EduQuest. Tớ đã học thuộc tài liệu của thầy cô rồi. Cậu có câu hỏi nào cần tớ giải đáp không?`
      }
    ]);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isJoined) {
      scrollToBottom();
    }
  }, [messages, isLoading, isJoined]);

  const handleSend = async (textToSend: string = input) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      // Lấy tài liệu từ Firestore thay vì IndexedDB
      let fullKnowledgeBase = "";
      try {
        const docRef = doc(db, "appData", "knowledgeBase");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          fullKnowledgeBase = docSnap.data().content || "";
        }
      } catch (err) {
        console.error("Lỗi khi lấy dữ liệu từ Firestore:", err);
      }
      
      const safeKnowledgeBase = fullKnowledgeBase.slice(0, 1000000);
      
      const systemInstruction = `Bạn là một Gia sư AI thân thiện, vui vẻ, xưng hô là "Tớ" và gọi học sinh là "${studentName}". 
Nhiệm vụ của bạn là trả lời câu hỏi của học sinh ĐÚNG TRỌNG TÂM dựa trên tài liệu tham khảo được cung cấp dưới đây. 
Hãy đọc thật kỹ toàn bộ tài liệu để tìm ra câu trả lời chính xác nhất. Trình bày rõ ràng, dùng emoji để bài viết sinh động.
Nếu câu hỏi nằm ngoài phạm vi tài liệu, hãy lịch sự từ chối và nhắc nhở học sinh hỏi các vấn đề liên quan đến bài học. Tuyệt đối không bịa đặt thông tin ngoài tài liệu.

TÀI LIỆU THAM KHẢO TỪ GIÁO VIÊN:
${safeKnowledgeBase.trim() ? safeKnowledgeBase : "HIỆN TẠI GIÁO VIÊN CHƯA CUNG CẤP TÀI LIỆU NÀO. Hãy trả lời học sinh rằng bạn đang chờ thầy cô tải tài liệu lên và chưa thể trả lời các câu hỏi chuyên môn."}`;

      const history = messages.filter(m => m.id !== "1").map(m => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }]
      }));

      const response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: [
          ...history,
          { role: "user", parts: [{ text: textToSend }] }
        ],
        config: {
          systemInstruction: systemInstruction,
        }
      });

      const aiMsg: Message = { id: (Date.now() + 1).toString(), role: "ai", content: response.text || "Xin lỗi, tớ đang bị lỗi một chút." };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (error: any) {
      console.error("Failed to get AI response", error);
      
      const errorMessage = error?.message || String(error);
      const currentHost = window.location.hostname;
      
      let userFriendlyMessage = `Ối, tớ gặp lỗi: ${errorMessage}`;
      
      if (errorMessage.toLowerCase().includes("key") || errorMessage.includes("process is not defined") || errorMessage.includes("API")) {
        if (currentHost.includes("vercel.app")) {
          userFriendlyMessage = `Tớ thấy cậu đang chạy trên Vercel (${currentHost}). Cậu bắt buộc phải thêm biến môi trường GEMINI_API_KEY vào phần Settings của Vercel thì tớ mới hoạt động được nhé! 🔑`;
        } else {
          userFriendlyMessage = `Lỗi kết nối AI: ${errorMessage}. (Đang chạy tại: ${currentHost})`;
        }
      }

      const errorMsg: Message = { 
        id: (Date.now() + 1).toString(), 
        role: "ai", 
        content: userFriendlyMessage 
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Màn hình nhập tên trước khi vào chat
  if (!isJoined) {
    return (
      <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="bg-white rounded-[2rem] p-8 md:p-12 shadow-2xl border border-purple-100 max-w-md w-full text-center relative overflow-hidden"
        >
          {/* Decorative blobs */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-orange-100 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
          
          <div className="relative z-10">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl mx-auto flex items-center justify-center shadow-lg mb-6 transform rotate-3">
              <Bot className="w-10 h-10 text-white" />
            </div>
            
            <h2 className="text-3xl font-extrabold text-gray-800 mb-2">Chào cậu! 👋</h2>
            <p className="text-gray-500 mb-8">Tớ là Gia sư AI. Cậu tên là gì nhỉ để tớ tiện xưng hô?</p>
            
            <form onSubmit={handleJoin} className="space-y-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <UserCircle className="h-6 w-6 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Nhập tên của cậu..."
                  className="w-full bg-gray-50 border-2 border-gray-100 focus:border-purple-400 focus:bg-white rounded-2xl py-4 pl-12 pr-4 outline-none transition-all text-gray-700 font-medium text-lg"
                  autoFocus
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={!nameInput.trim()}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Bắt đầu học <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)] flex flex-col drop-shadow-2xl">
      {/* Header */}
      <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-orange-500 rounded-t-[2rem] p-6 overflow-hidden shrink-0">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-yellow-300 opacity-20 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4"></div>
        
        <div className="relative z-10 flex items-center justify-between w-full">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 shadow-lg transform rotate-3">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-purple-600 rounded-full animate-pulse"></div>
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
                Gia sư AI EduQuest <Sparkles className="w-5 h-5 text-yellow-300" />
              </h2>
              <p className="text-blue-100 text-sm font-medium mt-0.5 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4" /> Luôn sẵn sàng giải đáp mọi thắc mắc!
              </p>
            </div>
          </div>

          {user ? (
            <Link 
              to="/app/teacher" 
              className="p-2 bg-white/10 hover:bg-white/20 rounded-xl border border-white/20 transition-colors flex items-center gap-2 text-sm font-medium text-white"
              title="Vào trang quản lý"
            >
              <Settings className="w-5 h-5" />
              <span className="hidden sm:inline">Quản lý</span>
            </Link>
          ) : (
            <Link 
              to="/app/teacher" 
              className="p-2 bg-white/10 hover:bg-white/20 rounded-xl border border-white/20 transition-colors flex items-center gap-2 text-xs font-medium text-white/70"
            >
              Đăng nhập GV
            </Link>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-gradient-to-b from-slate-50 to-purple-50/30 overflow-y-auto p-4 md:p-6 space-y-6 scroll-smooth">
        {/* Thông báo trạng thái tài liệu (chỉ hiện cho giáo viên) */}
        {user && (
          <div className="text-[10px] text-center text-gray-400 uppercase tracking-widest mb-4">
            Chế độ Giáo viên: Đã kết nối Firestore
          </div>
        )}
        <AnimatePresence>
          {messages.map((msg, index) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={cn(
                "flex gap-3 max-w-[90%] md:max-w-[80%]",
                msg.role === "user" ? "ml-auto flex-row-reverse" : ""
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-md z-10",
                msg.role === "user" 
                  ? "bg-gradient-to-br from-orange-400 to-orange-500 text-white" 
                  : "bg-gradient-to-br from-blue-500 to-purple-600 text-white"
              )}>
                {msg.role === "user" ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
              </div>
              
              <div className={cn(
                "p-4 text-[15px] leading-relaxed shadow-sm relative group",
                msg.role === "user" 
                  ? "bg-white text-gray-800 rounded-2xl rounded-tr-sm border border-gray-100" 
                  : "bg-white text-gray-800 rounded-2xl rounded-tl-sm border border-purple-100/50 shadow-purple-900/5"
              )}>
                <div className="whitespace-pre-wrap font-medium">{msg.content}</div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Suggested Prompts (Only show if no user messages yet) */}
        {messages.length === 1 && !isLoading && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col gap-2 mt-8 max-w-[80%] ml-14"
          >
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Gợi ý cho cậu:</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(prompt)}
                  className="text-left bg-white border border-purple-100 hover:border-purple-300 hover:bg-purple-50 text-purple-700 text-sm py-2 px-4 rounded-xl shadow-sm transition-all hover:-translate-y-0.5 flex items-center gap-2"
                >
                  <Lightbulb className="w-4 h-4 text-yellow-500" /> {prompt}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3 max-w-[80%]"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <Bot className="w-5 h-5" />
            </div>
            <div className="p-4 rounded-2xl bg-white border border-purple-100 rounded-tl-sm flex items-center gap-3 shadow-sm">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
              </div>
              <span className="text-purple-600/70 font-medium text-sm">Tớ đang suy nghĩ...</span>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white rounded-b-[2rem] border-t border-gray-100 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)] shrink-0">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }} 
          className="relative flex items-center max-w-4xl mx-auto"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Hỏi tớ về bài học hôm nay nhé..."
            className="w-full bg-gray-50 hover:bg-gray-100 focus:bg-white border-2 border-transparent focus:border-purple-400 rounded-full py-4 pl-6 pr-16 outline-none transition-all shadow-inner text-gray-700 font-medium placeholder:text-gray-400"
          />
          <button 
            type="submit" 
            disabled={!input.trim() || isLoading} 
            className="absolute right-2 w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full text-white flex items-center justify-center transition-all hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5 ml-1" />
          </button>
        </form>
      </div>
    </div>
  );
}
