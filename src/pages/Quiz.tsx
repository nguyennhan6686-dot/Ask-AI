import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Clock, Trophy, XCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { cn } from "../utils/cn";

// Mock Data
const MOCK_QUESTIONS = [
  {
    id: 1,
    question: "Định khoản nào sau đây là đúng khi mua thiết bị bằng tiền mặt?",
    options: [
      "Nợ: Tiền mặt, Có: Thiết bị",
      "Nợ: Thiết bị, Có: Phải trả người bán",
      "Nợ: Thiết bị, Có: Tiền mặt",
      "Nợ: Phải trả người bán, Có: Thiết bị"
    ],
    correctAnswer: 2,
  },
  {
    id: 2,
    question: "Số dư thông thường của tài khoản Doanh thu là gì?",
    options: ["Nợ", "Có", "Bằng không", "Tùy thuộc vào giao dịch"],
    correctAnswer: 1,
  },
  {
    id: 3,
    question: "Nếu công ty trả trước tiền thuê nhà, tài khoản nào được ghi Nợ?",
    options: ["Chi phí thuê nhà", "Tiền mặt", "Chi phí trả trước", "Phải trả người bán"],
    correctAnswer: 2,
  }
];

export function Quiz() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isFinished, setIsFinished] = useState(false);

  const question = MOCK_QUESTIONS[currentQuestion];

  useEffect(() => {
    if (isAnswered || isFinished) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isAnswered, isFinished, currentQuestion]);

  const handleTimeUp = () => {
    setIsAnswered(true);
    setSelectedAnswer(-1); // indicates timeout
  };

  const handleSelect = (index: number) => {
    if (isAnswered) return;
    setSelectedAnswer(index);
    setIsAnswered(true);
    
    if (index === question.correctAnswer) {
      setScore((prev) => prev + 100 + timeLeft * 2); // Bonus for time
    }
  };

  const handleNext = () => {
    if (currentQuestion < MOCK_QUESTIONS.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
      setTimeLeft(30);
    } else {
      setIsFinished(true);
    }
  };

  const restartQuiz = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setScore(0);
    setTimeLeft(30);
    setIsFinished(false);
  };

  if (isFinished) {
    return (
      <div className="max-w-2xl mx-auto mt-12">
        <Card className="p-12 text-center space-y-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", bounce: 0.5 }}
            className="w-32 h-32 bg-orange-100 rounded-full flex items-center justify-center mx-auto"
          >
            <Trophy className="w-16 h-16 text-orange-500" />
          </motion.div>
          
          <div>
            <h2 className="text-4xl font-bold text-gray-800 mb-2">Hoàn thành bài thi!</h2>
            <p className="text-xl text-gray-600">Bạn đạt được</p>
            <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mt-4">
              {score}
            </div>
            <p className="text-gray-500 mt-2">Điểm XP</p>
          </div>

          <Button size="lg" onClick={restartQuiz} className="w-full sm:w-auto">
            Chơi Lại
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="bg-white px-4 py-2 rounded-2xl shadow-sm font-bold text-gray-700">
            Câu hỏi {currentQuestion + 1} / {MOCK_QUESTIONS.length}
          </div>
          <div className="bg-orange-100 px-4 py-2 rounded-2xl shadow-sm font-bold text-orange-600 flex items-center gap-2">
            <Trophy className="w-4 h-4" /> {score}
          </div>
        </div>
        <div className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-2xl shadow-sm font-bold transition-colors",
          timeLeft <= 5 ? "bg-red-100 text-red-600 animate-pulse" : "bg-white text-gray-700"
        )}>
          <Clock className="w-4 h-4" /> 00:{timeLeft.toString().padStart(2, '0')}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-3 bg-gray-200 rounded-full mb-8 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
          initial={{ width: 0 }}
          animate={{ width: `${((currentQuestion) / MOCK_QUESTIONS.length) * 100}%` }}
        />
      </div>

      {/* Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
        >
          <Card className="p-8 md:p-12 mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-8 leading-tight">
              {question.question}
            </h2>

            <div className="space-y-4">
              {question.options.map((option, index) => {
                const isSelected = selectedAnswer === index;
                const isCorrect = index === question.correctAnswer;
                
                let optionState = "default";
                if (isAnswered) {
                  if (isCorrect) optionState = "correct";
                  else if (isSelected) optionState = "incorrect";
                  else optionState = "disabled";
                }

                return (
                  <motion.button
                    key={index}
                    whileHover={!isAnswered ? { scale: 1.01 } : {}}
                    whileTap={!isAnswered ? { scale: 0.99 } : {}}
                    onClick={() => handleSelect(index)}
                    disabled={isAnswered}
                    className={cn(
                      "w-full text-left p-6 rounded-2xl border-2 transition-all duration-200 font-medium text-lg flex items-center justify-between",
                      optionState === "default" && "border-gray-200 hover:border-purple-400 hover:bg-purple-50 bg-white text-gray-700",
                      optionState === "correct" && "border-green-500 bg-green-50 text-green-700",
                      optionState === "incorrect" && "border-red-500 bg-red-50 text-red-700",
                      optionState === "disabled" && "border-gray-100 bg-gray-50 text-gray-400 opacity-50"
                    )}
                  >
                    <span>{option}</span>
                    {optionState === "correct" && <CheckCircle2 className="w-6 h-6 text-green-500" />}
                    {optionState === "incorrect" && <XCircle className="w-6 h-6 text-red-500" />}
                  </motion.button>
                );
              })}
            </div>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Next Button */}
      <AnimatePresence>
        {isAnswered && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-end"
          >
            <Button size="lg" onClick={handleNext} className="gap-2">
              {currentQuestion < MOCK_QUESTIONS.length - 1 ? "Câu tiếp theo" : "Xem Kết quả"}
              <ArrowRight className="w-5 h-5" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
