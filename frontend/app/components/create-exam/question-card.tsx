"use client";

import { useFieldArray, useFormContext } from "react-hook-form";
import { renderQuestionType } from "./render_type";

type QuestionCardProps = {
    index: number,
    remove: (index: number) => void,
    dragHandleProps: Record<string, unknown>
}

export default function QuestionCard({ index, remove, dragHandleProps }: QuestionCardProps) {
    const { register, watch } = useFormContext(); //watch is used when we want the UI to change based on the form values

    const type = watch(`questions.${index}.type`); //this lets us read the current value of the form field and updates when it changes
    // const { fields, append } = useFieldArray({
    //     control,
    //     name: `questions.${index}.options`
    // });

    // const addOption = () => {
    //     append({ text: "", isCorrect: false });
    // };

    return (
        <div className="border rounded-lg p-4 m-2">
            <div className="flex flex-row gap-8">
                <div>
                    <span
                        {...dragHandleProps}
                        className="cursor-grab m-1">⋮⋮</span>
                    <input
                        className="border p-1 w-[40vw] h-[8vh] "
                        {...register(`questions.${index}.text`)}
                        placeholder="Question Text"
                    />
                </div>

                <div className=" flex flex-col w-[10vw]">
                    <label className="border-2 text-center">Points</label>
                    <input
                        className="my-1 border-2 text-center"
                        type="number"
                        {...register(`questions.${index}.points`, { valueAsNumber: true }
                        )}
                    />
                </div>
                <div className=" flex flex-col w-[18vw]">
                    <label className="border-2 text-center">Negative Points</label>
                    <input
                        className="border-2 text-center my-1"
                        type="number"

                        {...register(`questions.${index}.negativePoint`,
                            { valueAsNumber: true }
                        )}
                    />
                </div>
            </div>

            <div className="border flex w-fit ml-5">
                <select {...register(`questions.${index}.type`)}>
                    <option value="MCQ">MCQ</option>
                    <option value="MCA">MCA</option>
                    <option value="SHORT_TEXT">SHORT_TEXT</option>
                    <option value="CODING">CODING EDITOR</option>
                    <option value="INPUT">SINGLE LINE INPUT</option>
                    <option value="MATCH">MATCH</option>
                    <option value="COMPREHENSION">COMPREHENSION</option>
                </select>
            </div>

            {/* {fields.map((field, i) => (
                <OptionItem
                    key={field.id}
                    qIndex={index}
                    oIndex={i}
                />
            ))}
            <button
                className="border-2 m-1 p-1 rounded-md"
                type="button" onClick={addOption}>
                Add Option
            </button> */}

            {/* render question type component */}
            {renderQuestionType(type, index)}

            <button type="button"
                className="border-2 m-1 p-1 rounded-md"
                onClick={() => remove(index)}>Delete Question</button>
        </div>
    )
}