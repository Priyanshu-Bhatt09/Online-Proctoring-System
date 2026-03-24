import { useFieldArray, useFormContext } from "react-hook-form";
import OptionItem from "../option-item";

export default function MCQ({ index }: any) {
    //register - connects an input to the form state(the whole obje of data is a form state)
    //eg of register - register("questions.0.options.1.text") this means - this input controls the text of option 2 of question 1.
    //control - react hook form needs something that can manage its whole object and that manager is control, basically it manages every complex thing that happens in form internally like - array, nested fields, controllers
    const { register, control } = useFormContext(); //this is used to get the form functions from parent form


    //fields - it is not our actual form data, but it is a helper array used to render the UI, react hook form generates unique id for each item and stores them in fields that's why we use field.id, this keeps the input stabel even when we remove, add or reorder item
    const { fields, append } = useFieldArray({ //useFieldArray - used when your form contains an array of items like questions - and to manage this questions array(add, remove, reorder) we use useFieldArray 
        control,
        name: `questions.${index}.options` //this means Manage formData.questions[index].options so the name is basically a path inside the form object
    });

    return (
        <div>
            {fields.map((field, i) => ( //field is the current questions/options object and i is the position in the array
                <div key={field.id}>
                    <OptionItem
                        key={field.id}
                        qIndex={index}
                        oIndex={i}
                    />
                </div>
            ))}
            <button
                className="border-2 m-1 p-1 rounded-md"
                type="button" onClick={addOption}>
                Add Option
            </button>
        </div>
    )
}