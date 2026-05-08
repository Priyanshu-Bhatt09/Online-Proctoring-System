import { Editor } from "@monaco-editor/react";
import { useFormContext } from "react-hook-form";
import { useEffect, useRef } from "react";
import type { editor as monacoEditor } from "monaco-editor";

export default function Coding({ index }: any) {
    const { register, watch, setValue, getValues } = useFormContext();
    const studentEditorRef = useRef<monacoEditor.IStandaloneCodeEditor | null>(null);
    
    // Watch the form values
    const studentCode = watch(`questions.${index}.paragraph`) || "//Write code here";

    // Initialize fields on mount
    useEffect(() => {
        const currentValues = getValues();
        if (!currentValues.questions?.[index]?.paragraph) {
            setValue(`questions.${index}.paragraph`, "//Write code here", { shouldDirty: false });
        }
        if (!currentValues.questions?.[index]?.correctCode) {
            setValue(`questions.${index}.correctCode`, "", { shouldDirty: false });
        }
    }, [index, setValue, getValues]);

    const handleStudentCodeChange = (value: string | undefined) => {
        if (value !== undefined) {
            setValue(`questions.${index}.paragraph`, value, { 
                shouldValidate: false,
                shouldDirty: true 
            });
        }
    };

    return (
        <div className="flex flex-col gap-2">
            <div className="bg-[#fdf7e7] p-3 rounded mb-3 border-l-4 border-[#f7c873]">
                <p className="text-base font-semibold text-[#a67c00]">Student Code Editor:</p>
            </div>
            <div className="border border-[#b3b3a8] rounded-lg my-2 mx-2">
                <Editor
                    height="250px"
                    width="100%"
                    defaultLanguage="javascript"
                    value={studentCode}
                    onChange={handleStudentCodeChange}
                    onMount={(editor) => {
                        studentEditorRef.current = editor;
                    }}
                />
            </div>

            <div className="bg-[#eafaf1] p-3 rounded my-4 mx-2 border-l-4 border-[#3b7c5c]">
                <p className="text-base font-semibold text-[#217a4a] mb-2">✓ Enter the correct/reference code:</p>
                <textarea
                    {...register(`questions.${index}.correctCode`)}
                    placeholder="//Write the correct code here"
                    className="border border-[#b3b3a8] rounded-lg my-2 p-2 w-full font-mono text-sm bg-white font-sans"
                    rows={10}
                />
            </div>
        </div>
    );
}