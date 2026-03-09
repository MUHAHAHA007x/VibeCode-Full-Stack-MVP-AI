import React, { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  Sparkles,
  CheckSquare,
  Save,
  Trash2,
  PencilLine,
  RotateCcw,
  Loader2,
} from "lucide-react";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;

const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

function App() {
  const [bigTask, setBigTask] = useState("");
  const [tasks, setTasks] = useState([]);
  const [projectTitle, setProjectTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  const handleGenerate = async () => {
    setErrorMessage("");
    setSaveMessage("");

    if (!bigTask.trim()) {
      setErrorMessage("กรุณากรอกงานใหญ่ที่ต้องการย่อยก่อน");
      return;
    }

    if (!geminiApiKey) {
      setErrorMessage(
        "ไม่พบค่า VITE_GEMINI_API_KEY ในไฟล์ .env กรุณาตั้งค่าก่อนใช้งาน",
      );
      return;
    }

    setIsLoading(true);
    try {
      const systemPrompt =
        "คุณคือผู้ช่วยวางแผนงานที่ระมัดระวังและไม่แต่งข้อมูลขึ้นเอง ย่อยงานที่ได้รับเป็น 3-5 ขั้นตอนสั้นๆ ที่ทำได้จริงภายใน 2 ชม. ในรูปแบบ JSON array เท่านั้น โดยมีเงื่อนไขดังนี้:\n\n" +
        "1) ถ้างานที่ผู้ใช้กรอกคลุมเครือ ไม่มีบริบทเพียงพอ หรือดูไม่มีเหตุผล ให้สร้าง JSON array ที่มีเพียง 1 สตริงภาษาไทย แจ้งให้ผู้ใช้เพิ่มรายละเอียดงานให้ชัดเจนขึ้น แทนการเดาสุ่มหรือแต่งเนื้อหาขึ้นเอง\n" +
        "2) ทุกขั้นตอนต้องเป็นภาษาไทยเท่านั้น และต้องมีลำดับที่ต่อเนื่องกันอย่างมีเหตุผล สามารถทำได้จริงภายในเวลาไม่เกิน 2 ชั่วโมง\n" +
        "3) ห้ามส่งข้อความอื่นใดนอกเหนือจาก JSON array เด็ดขาด ห้ามมีคำอธิบายก่อนหน้า หลังจากนั้น หรือรูปแบบการจัดวางอื่น เช่น Markdown\n" +
        "4) ใช้ตรรกะ 'Confidence Score' ภายในใจ: ถ้าคุณไม่มั่นใจในรายละเอียด ให้กำหนดขั้นตอนในระดับภาพรวม (high-level) ที่ยังไม่ลงรายละเอียดปลีกย่อย ดีกว่าการให้คำแนะนำที่เฉพาะเจาะจงแต่ผิดพลาด\n" +
        "5) โครงสร้าง JSON สามารถเป็น array ของสตริง เช่น [\"ขั้นตอนที่ 1\", \"ขั้นตอนที่ 2\"] หรือ array ของอ็อบเจ็กต์ เช่น [{\"text\": \"ขั้นตอนตัวอย่าง 1\"}, {\"text\": \"ขั้นตอนตัวอย่าง 2\"}] แต่ต้องเป็น JSON array ที่ parse ได้จริงเท่านั้น";
      const userPrompt = `งานใหญ่: ${bigTask}`;

      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
          encodeURIComponent(geminiApiKey),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
              },
            ],
          }),
        },
      );

      if (!response.ok) {
        throw new Error("ไม่สามารถเรียกใช้บริการ AI ได้");
      }

      const data = await response.json();
      const rawText =
        data?.candidates?.[0]?.content?.parts
          ?.map((part) => part.text || "")
          .join("") || "";

      let parsed;
      try {
        parsed = JSON.parse(rawText);
      } catch {
        // พยายามดึงเฉพาะส่วนที่น่าจะเป็น JSON
        const firstBracket = rawText.indexOf("[");
        const lastBracket = rawText.lastIndexOf("]");
        if (firstBracket !== -1 && lastBracket !== -1) {
          const possibleJson = rawText.slice(firstBracket, lastBracket + 1);
          parsed = JSON.parse(possibleJson);
        } else {
          throw new Error("รูปแบบข้อมูลจาก AI ไม่ถูกต้อง");
        }
      }

      if (!Array.isArray(parsed)) {
        throw new Error("ข้อมูลที่ได้ไม่ใช่ JSON array");
      }

      const nextTasks = parsed.map((item, index) => {
        if (typeof item === "string") {
          return {
            id: `${Date.now()}-${index}`,
            text: item,
            done: false,
          };
        }

        if (typeof item === "object" && item !== null) {
          const text = item.text || item.description || item.title;
          return {
            id: `${Date.now()}-${index}`,
            text: text || `ขั้นตอนที่ ${index + 1}`,
            done: false,
          };
        }

        return {
          id: `${Date.now()}-${index}`,
          text: `ขั้นตอนที่ ${index + 1}`,
          done: false,
        };
      });

      setTasks(nextTasks);
    } catch (err) {
      console.error(err);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "เกิดข้อผิดพลาดขณะย่อยงาน กรุณาลองอีกครั้ง",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleTask = (id) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, done: !task.done } : task,
      ),
    );
  };

  const handleTaskTextChange = (id, text) => {
    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, text } : task)));
  };

  const handleDeleteTask = (id) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  };

  const handleRegenerate = () => {
    if (!bigTask.trim()) {
      setErrorMessage("กรุณากรอกงานใหญ่ก่อนย่อยใหม่");
      return;
    }
    handleGenerate();
  };

  const handleSaveProject = async () => {
    setErrorMessage("");
    setSaveMessage("");

    if (!supabase) {
      setErrorMessage(
        "ไม่พบการตั้งค่า Supabase (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY) ในไฟล์ .env",
      );
      return;
    }

    if (tasks.length === 0) {
      setErrorMessage("ยังไม่มีงานย่อยให้บันทึก กรุณาย่อยงานก่อน");
      return;
    }

    const title =
      projectTitle.trim() ||
      bigTask.trim() ||
      "โครงการที่สร้างจาก Simple Task Breaker";

    try {
      const { error } = await supabase.from("projects").insert([
        {
          title,
          tasks,
        },
      ]);

      if (error) {
        throw error;
      }

      setSaveMessage("บันทึกโครงการเรียบร้อยแล้ว");
    } catch (err) {
      console.error(err);
      setErrorMessage(
        "ไม่สามารถบันทึกโครงการไปยังฐานข้อมูล Supabase ได้ กรุณาตรวจสอบการตั้งค่าและลองใหม่",
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl bg-white/80 shadow-xl rounded-3xl border border-[#E0D5C8] backdrop-blur-sm p-6 sm:p-8">
        <header className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#2C1B18]/5 text-[#2C1B18] text-xs sm:text-sm font-medium mb-3">
            <CheckSquare className="w-4 h-4" />
            <span>Simple Task Breaker</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#2C1B18] tracking-tight">
            ย่อยงานใหญ่ให้จัดการง่ายใน 2 ชม.
          </h1>
          <p className="mt-2 text-sm sm:text-base text-[#5E4A42]">
            ป้อนงานใหญ่ของคุณ แล้วให้ AI ช่วยย่อยเป็นขั้นตอนสั้นๆ ที่ทำได้จริง
          </p>
        </header>

        <main className="space-y-6">
          <section className="space-y-3">
            <label className="block text-xs font-medium text-[#5E4A42] uppercase tracking-[0.2em]">
              งานใหญ่ที่ต้องการย่อย
            </label>
            <textarea
              value={bigTask}
              onChange={(e) => setBigTask(e.target.value)}
              placeholder="อธิบายงานใหญ่ที่คุณอยากย่อย เช่น วางแผนเปิดร้านกาแฟ หรือ เตรียมพรีเซนต์งานสำคัญ..."
              className="w-full min-h-[96px] sm:min-h-[120px] rounded-3xl border border-[#E0D5C8] bg-[#FAF7F2] px-4 py-3 text-sm sm:text-base text-[#2C1B18] placeholder:text-[#B9A79A] focus:outline-none focus:ring-2 focus:ring-[#8D6E63]/40 focus:border-[#8D6E63] resize-vertical"
            />
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isLoading}
                className="inline-flex items-center justify-center gap-2 rounded-3xl px-4 sm:px-6 py-2.5 text-sm sm:text-base font-medium text-white bg-[#2C1B18] hover:bg-[#2C1B18]/90 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm transition-colors"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>กำลังย่อยงานให้ง่ายขึ้น...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>ย่อยงานเลย</span>
                  </>
                )}
              </button>

              <div className="flex-1 flex gap-3 justify-between sm:justify-end">
                <button
                  type="button"
                  onClick={handleRegenerate}
                  disabled={isLoading || !bigTask.trim()}
                  className="inline-flex items-center justify-center gap-2 rounded-3xl px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-[#2C1B18] bg-[#FAF7F2] border border-[#E0D5C8] hover:bg-[#F2E7DD] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>ลองย่อยใหม่</span>
                </button>
              </div>
            </div>
          </section>

          {isLoading && (
            <div className="mt-2 rounded-3xl border border-dashed border-[#E0D5C8] bg-[#FAF7F2] px-4 py-3 flex items-start gap-3">
              <div className="mt-1">
                <Loader2 className="w-5 h-5 text-[#8D6E63] animate-spin" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#2C1B18]">
                  กำลังย่อยงานให้ง่ายขึ้น...
                </p>
                <p className="text-xs text-[#5E4A42] mt-1">
                  AI กำลังจัดโครงสร้างงานของคุณให้เป็นขั้นตอนสั้นๆ ที่ทำได้จริง
                </p>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
              {errorMessage}
            </div>
          )}

          {saveMessage && (
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              {saveMessage}
            </div>
          )}

          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="flex-1">
                <label className="block text-xs font-medium text-[#5E4A42] uppercase tracking-[0.2em] mb-1">
                  ชื่อโครงการ (ไม่บังคับ)
                </label>
                <input
                  type="text"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  placeholder="ตั้งชื่อให้โครงการนี้ เช่น แผนเปิดร้านกาแฟ Q2"
                  className="w-full rounded-3xl border border-[#E0D5C8] bg-[#FAF7F2] px-4 py-2.5 text-sm sm:text-base text-[#2C1B18] placeholder:text-[#B9A79A] focus:outline-none focus:ring-2 focus:ring-[#8D6E63]/40 focus:border-[#8D6E63]"
                />
              </div>

              <button
                type="button"
                onClick={handleSaveProject}
                className="inline-flex items-center justify-center gap-2 rounded-3xl px-4 sm:px-5 py-2.5 text-sm sm:text-base font-medium text-white bg-[#8D6E63] hover:bg-[#7A5F57] shadow-sm transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>บันทึกโครงการ</span>
              </button>
            </div>

            <div className="mt-2">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm sm:text-base font-semibold text-[#2C1B18]">
                  งานย่อยที่ได้จาก AI
                </h2>
                <span className="text-xs text-[#5E4A42]">
                  {tasks.length > 0
                    ? `${tasks.filter((t) => t.done).length}/${tasks.length} ขั้นตอนเสร็จแล้ว`
                    : "ยังไม่มีงานย่อย"}
                </span>
              </div>

              <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                {tasks.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-[#E0D5C8] bg-[#FAF7F2] px-4 py-4 text-xs sm:text-sm text-[#5E4A42] text-center">
                    ยังไม่มีงานย่อย กรุณาใส่งานใหญ่แล้วกดปุ่ม{" "}
                    <span className="font-medium">ย่อยงานเลย</span>
                  </div>
                ) : (
                  tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-start gap-3 rounded-2xl bg-[#FAF7F2] border border-[#E0D5C8] px-3 py-2.5"
                    >
                      <button
                        type="button"
                        onClick={() => handleToggleTask(task.id)}
                        className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border transition-colors ${
                          task.done
                            ? "bg-[#2C1B18] border-[#2C1B18]"
                            : "border-[#C8B9AE] bg-white"
                        }`}
                      >
                        {task.done && (
                          <CheckSquare className="w-3.5 h-3.5 text-white" />
                        )}
                      </button>

                      <div className="flex-1 space-y-1">
                        <div className="flex items-start gap-2">
                          <PencilLine className="w-3.5 h-3.5 text-[#B9A79A] mt-1 hidden sm:block" />
                          <textarea
                            value={task.text}
                            onChange={(e) =>
                              handleTaskTextChange(task.id, e.target.value)
                            }
                            rows={2}
                            className={`w-full bg-transparent border-none resize-none focus:outline-none text-sm sm:text-base ${
                              task.done
                                ? "line-through text-[#B9A79A]"
                                : "text-[#2C1B18]"
                            }`}
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteTask(task.id)}
                        className="mt-0.5 inline-flex items-center justify-center rounded-full p-1.5 text-[#B9A79A] hover:text-[#8D6E63] hover:bg-white/70 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        </main>

        <footer className="mt-6 pt-4 border-t border-[#E0D5C8] text-[11px] sm:text-xs text-[#8D6E63] flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>ทั้งหมดในหน้านี้แสดงผลเป็นภาษาไทยโดยอัตโนมัติ</span>
          <span className="opacity-80">
            สร้างโดย Simple Task Breaker · AI Assisted
          </span>
        </footer>
      </div>
    </div>
  );
}

export default App;

