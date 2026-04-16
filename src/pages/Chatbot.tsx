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
    <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)] flex flex-col relative group">
      {/* Background Glows */}
      <div className="absolute -top-20 -left-20 w-64 h-64 bg-blue-400/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-purple-400/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Header */}
      <div className="relative bg-white/40 backdrop-blur-xl rounded-t-[2.5rem] p-6 border border-white/40 shadow-xl shrink-0 z-20 overflow-hidden">
        {/* Animated background gradient line */}
        <motion.div 
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50"
        />
        
        <div className="relative z-10 flex items-center justify-between w-full">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 transition-transform hover:rotate-0">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full shadow-sm"></div>
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                Gia sư AI <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">EduQuest</span> <Sparkles className="w-5 h-5 text-yellow-500" />
              </h2>
              <p className="text-gray-500 text-sm font-medium mt-0.5 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-purple-500" /> Đồng hành cùng {studentName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {user ? (
              <Link 
                to="/app/teacher" 
                className="p-2.5 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-xl border border-purple-100 transition-all flex items-center gap-2 text-sm font-bold shadow-sm"
                title="Vào trang quản lý"
              >
                <Settings className="w-5 h-5" />
                <span className="hidden sm:inline">Quản lý</span>
              </Link>
            ) : (
              <Link 
                to="/app/teacher" 
                className="p-2.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl border border-gray-200 transition-all text-xs font-bold"
              >
                Đăng nhập GV
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-white/20 backdrop-blur-sm overflow-y-auto p-4 md:p-8 space-y-8 scroll-smooth relative z-10 border-x border-white/40">
        {user && (
          <div className="flex justify-center mb-6">
            <div className="px-3 py-1 bg-purple-100/50 backdrop-blur-md border border-purple-200 rounded-full text-[10px] font-bold text-purple-600 uppercase tracking-widest">
              Chế độ Giáo viên
            </div>
          </div>
        )}
        
        <AnimatePresence mode="popLayout">
          {messages.map((msg, index) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              className={cn(
                "flex gap-4 max-w-[92%] md:max-w-[85%]",
                msg.role === "user" ? "ml-auto flex-row-reverse" : ""
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg z-10 mt-1",
                msg.role === "user" 
                  ? "bg-gradient-to-br from-orange-400 to-orange-600 text-white" 
                  : "bg-gradient-to-br from-blue-600 to-purple-700 text-white"
              )}>
                {msg.role === "user" ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
              </div>
              
              <div className={cn(
                "p-5 text-[15px] leading-relaxed shadow-xl relative group transition-all",
                msg.role === "user" 
                  ? "bg-white text-gray-800 rounded-3xl rounded-tr-none border border-gray-100 shadow-orange-900/5" 
                  : "bg-white text-gray-800 rounded-3xl rounded-tl-none border border-purple-100 shadow-purple-900/5"
              )}>
                <div className="whitespace-pre-wrap font-medium leading-relaxed">{msg.content}</div>
                
                {/* Subtle timestamp or indicator could go here */}
                <div className={cn(
                  "absolute -bottom-5 text-[10px] font-bold uppercase tracking-tighter opacity-0 group-hover:opacity-40 transition-opacity",
                  msg.role === "user" ? "right-0" : "left-0"
                )}>
                  {msg.role === "user" ? "Bạn" : "Gia sư AI"}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Suggested Prompts */}
        {messages.length === 1 && !isLoading && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col gap-3 mt-10 ml-14"
          >
            <div className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest">
              <Sparkles className="w-3 h-3 text-yellow-500" /> Gợi ý cho cậu
            </div>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(prompt)}
                  className="text-left bg-white/80 backdrop-blur-md border border-purple-100 hover:border-purple-400 hover:bg-purple-50 text-purple-700 text-sm py-3 px-5 rounded-2xl shadow-sm transition-all hover:-translate-y-1 hover:shadow-md flex items-center gap-3 group"
                >
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                    <Lightbulb className="w-4 h-4 text-yellow-600" />
                  </div>
                  <span className="font-bold">{prompt}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-4 max-w-[80%]"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-700 text-white flex items-center justify-center shrink-0 shadow-lg">
              <Bot className="w-5 h-5" />
            </div>
            <div className="p-5 rounded-3xl bg-white border border-purple-100 rounded-tl-none flex items-center gap-4 shadow-xl">
              <div className="flex gap-1.5">
                <motion.span 
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                  className="w-2 h-2 bg-purple-400 rounded-full"
                ></motion.span>
                <motion.span 
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                  className="w-2 h-2 bg-purple-500 rounded-full"
                ></motion.span>
                <motion.span 
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                  className="w-2 h-2 bg-purple-600 rounded-full"
                ></motion.span>
              </div>
              <span className="text-purple-700 font-black text-xs uppercase tracking-widest">Đang suy nghĩ...</span>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} className="h-8" />
      </div>

      {/* Input Area */}
      <div className="p-6 bg-white/60 backdrop-blur-xl rounded-b-[2.5rem] border border-white/40 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] shrink-0 z-20">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }} 
          className="relative flex items-center max-w-4xl mx-auto group"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Hỏi tớ về bài học hôm nay nhé..."
            className="w-full bg-white/80 hover:bg-white focus:bg-white border-2 border-gray-100 focus:border-purple-500 rounded-2xl py-5 pl-7 pr-20 outline-none transition-all shadow-sm text-gray-800 font-bold placeholder:text-gray-400 text-lg"
          />
          <button 
            type="submit" 
            disabled={!input.trim() || isLoading} 
            className="absolute right-2.5 w-14 h-14 bg-gradient-to-br from-blue-600 via-purple-600 to-purple-700 rounded-xl text-white flex items-center justify-center transition-all hover:scale-105 hover:shadow-xl hover:rotate-2 disabled:opacity-30 disabled:hover:scale-100 disabled:hover:rotate-0 disabled:cursor-not-allowed shadow-lg"
          >
            <Send className="w-6 h-6 ml-1" />
          </button>
        </form>
        <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mt-4">
          EduQuest AI • Học tập thông minh hơn mỗi ngày
        </p>
      </div>
    </div>
  );
}
