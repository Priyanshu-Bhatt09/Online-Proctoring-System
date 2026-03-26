import Coding from "./types/coding";
import Input from "./types/input";
import MCA from "./types/mca";
import MCQ from "./types/mcq";
import ShortText from "./types/short-text";

export function renderQuestionType(type: string, index: number) {
    switch(type) {
        case "MCQ":
            return <MCQ index={index} />;

        case "MCA":
            return <MCA index={index} />;

        case "SHORT_TEXT":
            return <ShortText index={index}/>

        case "INPUT":
            return <Input index={index}/>

        case "CODING":
            return <Coding />
        default:
            return null;
    }
}