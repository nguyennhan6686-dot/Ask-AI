import { motion } from "motion/react";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Brain, MessageSquare, Trophy, Star, Zap } from "lucide-react";
import { Link } from "react-router-dom";

export function Home() {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-blue-600 via-purple-600 to-orange-500 p-8 md:p-16 text-white text-center shadow-2xl">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 max-w-3xl mx-auto space-y-6"
        >
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <Zap className="w-4 h-4 text-yellow-300" />
            <span>Học giả Kế toán Cấp 5</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
            Học Kế toán <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-300">
              Thật Vui Nhộn!
            </span>
          </h1>
          <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto">
            Nắm vững định khoản, bảng cân đối kế toán và báo cáo tài chính thông qua các bài trắc nghiệm tương tác và gia sư AI.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Link to="/quiz">
              <Button size="lg" className="w-full sm:w-auto bg-white text-purple-600 hover:bg-gray-50">
                Bắt đầu Học
              </Button>
            </Link>
            <Link to="/chat">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-white text-white hover:bg-white/10">
                Hỏi Gia sư AI
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Stats / Gamification */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Tổng XP", value: "1.250", icon: Trophy, color: "text-orange-500", bg: "bg-orange-100" },
          { label: "Chuỗi ngày học", value: "5 Ngày", icon: Zap, color: "text-yellow-500", bg: "bg-yellow-100" },
          { label: "Bài đã qua", value: "12", icon: Brain, color: "text-blue-500", bg: "bg-blue-100" },
          { label: "Huy hiệu", value: "4", icon: Star, color: "text-purple-500", bg: "bg-purple-100" },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="p-6 flex flex-col items-center text-center space-y-2">
              <div className={`p-3 rounded-2xl ${stat.bg}`}>
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
              <h3 className="text-2xl font-bold text-gray-800">{stat.value}</h3>
              <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
            </Card>
          </motion.div>
        ))}
      </section>

      {/* Features */}
      <section className="grid md:grid-cols-2 gap-8">
        <Card hoverable className="p-8 bg-gradient-to-br from-blue-50 to-purple-50 border-none">
          <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/30">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold mb-4 text-gray-800">Trắc nghiệm Tương tác</h2>
          <p className="text-gray-600 mb-6 text-lg">
            Kiểm tra kiến thức với các bài trắc nghiệm thú vị. Kiếm điểm, vượt qua thời gian và leo lên bảng xếp hạng!
          </p>
          <Link to="/quiz">
            <Button>Chơi Ngay</Button>
          </Link>
        </Card>

        <Card hoverable className="p-8 bg-gradient-to-br from-purple-50 to-orange-50 border-none">
          <div className="w-16 h-16 bg-purple-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-purple-500/30">
            <MessageSquare className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold mb-4 text-gray-800">Gia sư AI</h2>
          <p className="text-gray-600 mb-6 text-lg">
            Gặp khó khăn với định khoản? Hãy hỏi gia sư AI để được giải thích chi tiết và hỗ trợ cá nhân hóa.
          </p>
          <Link to="/chat">
            <Button>Trò chuyện với AI</Button>
          </Link>
        </Card>
      </section>
    </div>
  );
}
