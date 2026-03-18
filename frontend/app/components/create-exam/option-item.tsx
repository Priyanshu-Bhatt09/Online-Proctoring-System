"use client";

import { useFormContext } from "react-hook-form";

export default function OptionItem({qIndex, oIndex}: any){
    const {register} = useFormContext();

    return(
        <div className="flex gap-2 mt-2">
            <input type="radio" 
            {...register(`questions.${qIndex}.correctOption`)}
            value={oIndex}
            />
            <input 
            {...register(`questions.${qIndex}.options.${oIndex}.text`)}
            placeholder={`Option ${oIndex + 1}`}
            />
        </div>
    )
}