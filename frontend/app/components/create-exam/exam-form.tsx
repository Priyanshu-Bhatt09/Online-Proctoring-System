"use client";

import { ExamFormValues, examSchema } from "@/app/schema/exam-schema";
import { useForm, useFieldArray, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
// import QuestionCard from "./question-card";
import { closestCenter, DndContext } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import SortableQuestion from "./sortable-question";
import { useState } from "react";
import api from "@/app/api/axios";
import { useRouter } from "next/navigation";

export default function ExamForm() {
    const [isSaving, setIsSaving] = useState(false);
    
    //useForm - hook from react-hook-form
    const methods = useForm<ExamFormValues>({
        resolver: zodResolver(examSchema), //this tells- use the zod schema to validate the form
        mode: 'onBlur', //validate on blur instead of onChange for better UX
        defaultValues: { //this sets the initial state of the form
            title: "",
            questions: []
        }
    });

    const { control, register, handleSubmit, formState: { errors } } = methods; //methods is an object that contains many utilities for managing a form, and this line says take these specific properties from methods object and store them in seprate variable

    const router = useRouter();
    const { fields, append, remove, move } = useFieldArray({ //usefieldarray - hook from react-hook-form designed for arrays inside form
        control, //connects this field array to the form created earlier with useForm
        name: "questions" //this tells ReactHookForm - the dynamic array we want to manage is called questions
    });

    function handleDragEnd(event: any) {
        const { active, over } = event; //active - the item we dragged, and over - the item you dropped on
        if (!over) return; //someties we drop outside the list in that case we stop

        if (active.id !== over.id) { //check if position changed, if we drop the item on itself no need to reorder
            const oldIndex = fields.findIndex(f => f.id === active.id); //this finds where the old item was before
            const newIndex = fields.findIndex(f => f.id === over.id); //finds the new index where the item was dropped

            move(oldIndex, newIndex);
        }
    }

    const addQuestion = () => {
        append({
            text: "",
            points: 1,
            negativePoint: 0,
            paragraph: "",
            type: "MCQ",
            options: [
                { text: "", isCorrect: false },
                { text: "", isCorrect: false }
            ],
            correctOption: undefined,
            correctAnswer: "",
            correctCode: ""
        });
    };

    const validateAndProcessQuestions = (questions: any[]): { valid: boolean; error?: string; processedQuestions?: any[] } => {
        console.log("🔍 validateAndProcessQuestions called with:", questions);
        
        if (!questions || questions.length === 0) {
            const err = "Please add at least one question";
            console.error("❌ Validation error:", err);
            throw new Error(err);
        }

        const processedQuestions = questions.map((q, qIdx) => {
            const processed = { ...q };

            // Validate question text
            if (!q.text || q.text.trim() === "") {
                const err = `Question ${qIdx + 1}: Please enter question text`;
                console.error("❌ Validation error:", err);
                throw new Error(err);
            }

            // Validate options exist for MCQ/MCA
            if ((q.type === "MCQ" || q.type === "MCA") && (!q.options || q.options.length < 2)) {
                const err = `Question ${qIdx + 1} (${q.type}): Please add at least 2 options`;
                console.error("❌ Validation error:", err);
                throw new Error(err);
            }

            // Validate MCQ - must have correctOption selected
            if (q.type === "MCQ") {
                const correctOption = q.correctOption !== undefined ? q.correctOption : null;
                if (correctOption === null || correctOption === "" || correctOption === undefined) {
                    const err = `Question ${qIdx + 1} (MCQ): Please select the correct answer`;
                    console.error("❌ Validation error:", err);
                    throw new Error(err);
                }
                // Validate correctOption is a valid index
                const correctIdx = parseInt(String(correctOption));
                if (isNaN(correctIdx) || correctIdx < 0 || correctIdx >= q.options.length) {
                    const err = `Question ${qIdx + 1} (MCQ): Invalid correct answer selection`;
                    console.error("❌ Validation error:", err);
                    throw new Error(err);
                }
                // Convert correctOption index to isCorrect on options
                processed.options = q.options.map((opt: any, idx: number) => ({
                    ...opt,
                    isCorrect: idx === correctIdx
                }));
                delete processed.correctOption;
            }

            // Validate MCA - must have at least one correct answer
            if (q.type === "MCA") {
                const hasCorrect = q.options.some((opt: any) => opt.isCorrect);
                if (!hasCorrect) {
                    const err = `Question ${qIdx + 1} (MCA): Please check at least one correct answer`;
                    console.error("❌ Validation error:", err);
                    throw new Error(err);
                }
            }

            // Validate SHORT_TEXT - must have correct answer
            if (q.type === "SHORT_TEXT") {
                if (!q.correctAnswer || q.correctAnswer.trim() === "") {
                    const err = `Question ${qIdx + 1} (SHORT_TEXT): Please enter the correct answer`;
                    console.error("❌ Validation error:", err);
                    throw new Error(err);
                }
            }

            // Validate INPUT - must have correct answer
            if (q.type === "INPUT") {
                if (!q.correctAnswer || q.correctAnswer.trim() === "") {
                    const err = `Question ${qIdx + 1} (INPUT): Please enter the correct answer`;
                    console.error("❌ Validation error:", err);
                    throw new Error(err);
                }
            }

            // Validate CODING - must have correct code
            if (q.type === "CODING") {
                const correctCodeValue = q.correctCode || "";
                const trimmedCode = correctCodeValue.trim();
                const isDefaultCode = trimmedCode === "" || 
                                     trimmedCode === "//Write the correct code here" ||
                                     trimmedCode === "//write code here" ||
                                     trimmedCode.length < 5;
                
                console.log(`📝 CODING Question ${qIdx + 1}:`, {
                    correctCode: correctCodeValue,
                    trimmed: trimmedCode,
                    length: trimmedCode.length,
                    isDefaultCode
                });
                
                if (isDefaultCode) {
                    const err = `Question ${qIdx + 1} (CODING): Please write actual code in the reference editor (at least 5 characters)`;
                    console.error("❌ Validation error:", err);
                    throw new Error(err);
                }
            }

            return processed;
        });

        console.log("✅ All questions validated successfully");
        return { valid: true, processedQuestions };
    };

    const saveExam = async (data: ExamFormValues): Promise<number> => {
        try {
            console.log("🔄 saveExam function called");
            console.log("📊 Full form data:", data);

            // Validate exam title
            if (!data.title || data.title.trim() === "") {
                const err = "Please enter an exam title";
                console.error("❌ Validation error:", err);
                alert(err);
                throw new Error(err);
            }

            // Validate and process questions
            const { processedQuestions } = validateAndProcessQuestions(data.questions);
            console.log("Questions validated and processed:", processedQuestions);

            //create exam first to get the data id
            console.log("📤 Creating exam with title:", data.title);
            const examRes = await api.post("/exam", {
                title: data.title
            });

            const examId = examRes.data.id;
            console.log("✅ Exam created with ID:", examId);

            //save each question
            for (let i = 0; i < processedQuestions!.length; i++) {
                const q = processedQuestions![i];
                console.log(`📤 Saving question ${i + 1}:`, q);
                
                await api.post("/question", {
                    examId: examId,
                    text: q.text,
                    type: q.type,
                    points: q.points,
                    negativePoint: q.negativePoint,
                    options: q.options
                });
            }
            
            console.log("✅ All questions saved successfully");
            alert("Exam saved successfully!");
            return examId;
        } catch (error: any) {
            const errorMessage = error.message || "Error saving exam";
            console.error("❌ Save error:", error);
            if (error.response?.data?.message) {
                console.error("Backend error:", error.response.data.message);
            }
            alert(errorMessage);
            throw error;
        }
    }

    const handleSaveClick = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        console.log("📋 Save button clicked");
        // Trigger form submission
        await handleSubmit(onSave)();
    };

    const onSave = async (data: ExamFormValues): Promise<void> => {
        try {
            console.log("✅ onSave clicked");
            console.log("📊 FULL form data:", JSON.stringify(data, null, 2));
            
            // Log EACH question
            data.questions.forEach((q, idx) => {
                console.log(`\n🔍 Question ${idx + 1}:`);
                console.log(`  type: ${q.type}`);
                console.log(`  text: "${q.text}"`);
                if (q.type === "CODING") {
                    console.log(`  correctCode: "${q.correctCode}"`);
                    console.log(`  correctCode length: ${q.correctCode?.length || 0}`);
                    console.log(`  correctCode typeof: ${typeof q.correctCode}`);
                }
            });
            
            setIsSaving(true);
            await saveExam(data);
        } catch (error) {
            console.error("Save error:", error);
        } finally {
            setIsSaving(false);
        }
    }

    const onSaveAndProceed = async (data: ExamFormValues): Promise<void> => {
        try {
            console.log("✅ onSaveAndProceed clicked - Form data:", data);
            console.log("Form Errors:", errors);
            setIsSaving(true);
            const examId = await saveExam(data);
            router.push(`/test-settings/${examId}`);
        } catch (error) {
            console.error("error: ", error);
        } finally {
            setIsSaving(false);
        }
    }
    return (
        <FormProvider {...methods}>
            <form onSubmit={handleSaveClick} className="font-sans bg-[#f8f8f5] min-h-screen py-10 px-2 flex flex-col items-center">
                <div className="w-full max-w-3xl flex flex-col gap-2 mb-6">
                    <label className="font-bold text-lg ml-1">Exam Name</label>
                    <input
                        className="border border-[#b3b3a8] rounded-lg px-4 py-2 text-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#3b7c5c]"
                        {...register("title")}
                        placeholder="Enter exam title"
                    />
                </div>

                <div className="w-full max-w-3xl flex flex-col gap-6">
                    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
                            {fields.map((field, index) => (
                                <div key={field.id} className="bg-white rounded-2xl shadow border border-[#e0e0d1] p-6 mb-8">
                                    <SortableQuestion id={field.id} index={index} remove={remove} />
                                </div>
                            ))}
                        </SortableContext>
                    </DndContext>
                </div>

                <div className="w-full max-w-3xl flex flex-col gap-4 mt-2">
                    <button
                        className="w-full font-sans py-3 rounded-lg bg-[#3b7c5c] text-white font-semibold text-lg shadow hover:bg-[#2e6248] transition-colors border border-[#3b7c5c]"
                        type="button"
                        onClick={addQuestion}
                        disabled={isSaving}
                    >
                        Add Question
                    </button>
                </div>

                <div className="w-full max-w-3xl flex gap-4 mt-6">
                    <button
                        className="flex-1 py-3 rounded-lg bg-[#3b7c5c] text-white font-semibold text-lg shadow hover:bg-[#2e6248] transition-colors border border-[#3b7c5c] disabled:opacity-50 disabled:cursor-not-allowed"
                        type="submit"
                        disabled={isSaving}
                    >
                        {isSaving ? "Saving..." : "Save"}
                    </button>
                    <button
                        className="flex-1 py-3 rounded-lg bg-[#3b7c5c] text-white font-semibold text-lg shadow hover:bg-[#2e6248] transition-colors border border-[#3b7c5c] disabled:opacity-50 disabled:cursor-not-allowed"
                        type="button"
                        onClick={handleSubmit(onSaveAndProceed)}
                        disabled={isSaving}
                    >
                        {isSaving ? "Saving..." : "Save & Proceed"}
                    </button>
                </div>
            </form>
        </FormProvider>
    );

}



