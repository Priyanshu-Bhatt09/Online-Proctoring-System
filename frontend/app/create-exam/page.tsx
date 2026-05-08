'use client';

import { useAuthProtection } from "../hooks/useAuthProtection";
import ExamForm from "../components/create-exam/exam-form";

const Exam = () => {
    useAuthProtection();

    return(
        <>
        <div className="bg-amber-100 min-h-screen">
            <ExamForm />
        </div>
        </>
    )
}
export default Exam;