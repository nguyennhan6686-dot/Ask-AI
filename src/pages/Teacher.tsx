import { useState, useEffect } from "react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Plus, Save, Trash2, FileText, Upload, Loader2, Lock } from "lucide-react";
import { motion } from "motion/react";
import * as mammoth from "mammoth";
import * as pdfjsLib from "pdfjs-dist";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { db, auth } from "../firebase";

// Cấu hình worker cho PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
}

export function Teacher() {
  const [user, setUser] = useState<User | null>(null);
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: "1",
      text: "Định khoản nào sau đây là đúng khi mua thiết bị bằng tiền mặt?",
      options: [
        "Nợ: Tiền mặt, Có: Thiết bị",
        "Nợ: Thiết bị, Có: Phải trả người bán",
        "Nợ: Thiết bị, Có: Tiền mặt",
        "Nợ: Phải trả người bán, Có: Thiết bị"
      ],
      correctAnswer: 2,
    }
  ]);

  const [knowledgeBase, setKnowledgeBase] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Tải dữ liệu từ Firestore thay vì localforage
    const loadData = async () => {
      try {
        const docRef = doc(db, "appData", "knowledgeBase");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setKnowledgeBase(docSnap.data().content || "");
        }
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu từ Firestore:", error);
      } finally {
        setIsLoadingData(false);
      }
    };
    loadData();
  }, []);

  const handleSave = async () => {
    if (!user) {
      alert("Bạn cần đăng nhập để lưu tài liệu!");
      return;
    }
    setIsSaving(true);
    try {
      // Lưu dữ liệu lên Firestore
      const docRef = doc(db, "appData", "knowledgeBase");
      await setDoc(docRef, { content: knowledgeBase }, { merge: true });
      alert("Đã lưu tài liệu và câu hỏi lên hệ thống thành công!");
    } catch (error) {
      console.error("Lỗi khi lưu tài liệu:", error);
      alert("Có lỗi xảy ra khi lưu tài liệu. Vui lòng kiểm tra quyền truy cập (Security Rules) trên Firebase.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    try {
      if (file.name.endsWith('.txt')) {
        const text = await file.text();
        setKnowledgeBase(prev => prev + (prev ? "\n\n" : "") + text);
      } else if (file.name.endsWith('.docx')) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        setKnowledgeBase(prev => prev + (prev ? "\n\n" : "") + result.value);
      } else if (file.name.endsWith('.pdf')) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(" ");
          fullText += pageText + "\n";
        }
        setKnowledgeBase(prev => prev + (prev ? "\n\n" : "") + fullText);
      } else {
        alert("Định dạng file không được hỗ trợ! Vui lòng chọn .txt, .pdf hoặc .docx");
      }
    } catch (error) {
      console.error("Lỗi khi đọc file:", error);
      alert("Có lỗi xảy ra khi đọc file. Vui lòng thử lại.");
    } finally {
      setIsUploading(false);
      e.target.value = ''; // Reset input
    }
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: Date.now().toString(),
        text: "",
        options: ["", "", "", ""],
        correctAnswer: 0,
      }
    ]);
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const updateQuestionText = (id: string, text: string) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, text } : q));
  };

  const updateOption = (qId: string, optIndex: number, text: string) => {
    setQuestions(questions.map(q => {
      if (q.id === qId) {
        const newOptions = [...q.options];
        newOptions[optIndex] = text;
        return { ...q, options: newOptions };
      }
      return q;
    }));
  };

  const updateCorrectAnswer = (qId: string, index: number) => {
    setQuestions(questions.map(q => q.id === qId ? { ...q, correctAnswer: index } : q));
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
        <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center">
          <Lock className="w-12 h-12 text-purple-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-800">Yêu cầu Đăng nhập</h2>
        <p className="text-gray-500 max-w-md">
          Khu vực này dành riêng cho Giáo viên. Vui lòng nhấn nút "Đăng nhập" ở góc phải màn hình (hoặc thanh menu) để tiếp tục.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Bảng điều khiển Giáo viên</h1>
          <p className="text-gray-500 mt-1">Quản lý nội dung trắc nghiệm và tài liệu học tập</p>
        </div>
        <Button className="gap-2" onClick={handleSave} disabled={isSaving}>
          <Save className="w-5 h-5" /> {isSaving ? "Đang lưu..." : "Lưu Thay đổi"}
        </Button>
      </div>

      {/* Document Upload Section */}
      <Card className="p-8 bg-gradient-to-br from-blue-50 to-indigo-50 border-none">
        <div className="flex flex-col md:flex-row items-start gap-6">
          <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center shrink-0">
            <FileText className="w-8 h-8 text-blue-500" />
          </div>
          <div className="flex-1 w-full">
            <h3 className="text-xl font-bold text-gray-800 mb-2">Tài liệu Tham khảo cho AI</h3>
            <p className="text-gray-600 mb-4">
              Nhập nội dung hoặc tải lên tệp văn bản (.txt). Gia sư AI sẽ <strong>chỉ dựa vào nội dung này</strong> để trả lời đúng trọng tâm câu hỏi của học sinh.
            </p>
            
            <div className="space-y-4">
              <textarea
                value={knowledgeBase}
                onChange={(e) => setKnowledgeBase(e.target.value)}
                placeholder="Dán nội dung bài học, quy định, hoặc kiến thức vào đây..."
                className="w-full h-48 bg-white border border-gray-200 rounded-xl p-4 focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none transition-all resize-none"
              />
              
              <div className="flex items-center gap-4">
                <label className="relative cursor-pointer">
                  <Button variant="secondary" className="gap-2 pointer-events-none" disabled={isUploading}>
                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} 
                    {isUploading ? "Đang xử lý..." : "Tải lên tệp (.txt, .pdf, .docx)"}
                  </Button>
                  <input 
                    type="file" 
                    accept=".txt,.pdf,.docx" 
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                  />
                </label>
                <span className="text-sm text-gray-500">Hỗ trợ file Text, PDF và Word.</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800 px-2">Danh sách Câu hỏi</h2>
        {questions.map((q, index) => (
          <motion.div key={q.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700">Trình chỉnh sửa Câu hỏi</h3>
                </div>
                <button 
                  onClick={() => removeQuestion(q.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors p-2"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung Câu hỏi</label>
                  <textarea
                    value={q.text}
                    onChange={(e) => updateQuestionText(q.id, e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-purple-200 focus:border-purple-500 outline-none transition-all"
                    rows={2}
                    placeholder="Nhập câu hỏi tại đây..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {q.options.map((opt, optIndex) => (
                    <div key={optIndex} className="flex items-center gap-3">
                      <input
                        type="radio"
                        name={`correct-${q.id}`}
                        checked={q.correctAnswer === optIndex}
                        onChange={() => updateCorrectAnswer(q.id, optIndex)}
                        className="w-5 h-5 text-purple-600 focus:ring-purple-500"
                      />
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => updateOption(q.id, optIndex, e.target.value)}
                        placeholder={`Lựa chọn ${optIndex + 1}`}
                        className={`flex-1 bg-gray-50 border rounded-xl p-3 outline-none transition-all ${
                          q.correctAnswer === optIndex 
                            ? 'border-purple-500 bg-purple-50/50' 
                            : 'border-gray-200 focus:border-purple-500'
                        }`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <Button variant="outline" className="w-full border-dashed border-2 py-8 text-gray-500 hover:text-purple-600 hover:border-purple-500 hover:bg-purple-50 gap-2" onClick={addQuestion}>
        <Plus className="w-6 h-6" /> Thêm Câu hỏi Mới
      </Button>
    </div>
  );
}
