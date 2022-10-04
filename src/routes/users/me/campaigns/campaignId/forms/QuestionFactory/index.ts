import PreselectionFormFields from "@src/features/db/class/PreselectionFormFields";
import CustomUserFields from "@src/features/db/class/CustomUserFields";
import CustomUserFieldExtras from "@src/features/db/class/CustomUserFieldExtras";
import Question from "./Questions";
import SelectableQuestion from "./Questions/SelectableQuestion";
import CufTextQuestion from "./Questions/CufTextQuestion";
import CufSelectQuestion from "./Questions/CufSelectableQuestion";
import CufMultiSelectQuestion from "./Questions/CufMultiSelectQuestion";
import PhoneQuestion from "./Questions/PhoneQuestion";
import GenderQuestion from "./Questions/GenderQuestion";
import AddressQuestion from "./Questions/AddressQuestion";
import SimpleTextQuestion from "./Questions/SimpleTextQuestion";

type QuestionType = Awaited<
  ReturnType<PreselectionFormFields["query"]>
>[number];

class QuestionFactory {
  static async create(question: QuestionType, testerId: number) {
    if (this.isSelectable(question)) {
      return new SelectableQuestion(question);
    } else if (this.isCuf(question)) {
      const customUserFields = new CustomUserFields();

      const cufId = parseInt(question.type.replace("cuf_", ""));
      const cuf = await customUserFields.get(cufId);
      if (cuf.type === "text") {
        return new CufTextQuestion({
          question,
          customUserField: cuf,
          testerId,
        });
      } else if (cuf.type === "select" || cuf.type === "multiselect") {
        const customUserFieldExtras = new CustomUserFieldExtras();
        const fieldOptions = await customUserFieldExtras.query({
          where: [{ custom_user_field_id: cufId }],
        });
        if (fieldOptions.length === 0) return false;
        if (cuf.type === "select") {
          return new CufSelectQuestion({
            question,
            customUserField: cuf,
            options: fieldOptions,
            testerId,
          });
        }
        if (cuf.type === "multiselect") {
          return new CufMultiSelectQuestion({
            question,
            customUserField: cuf,
            options: fieldOptions,
            testerId,
          });
        }
      } else {
        return false;
      }
    } else if (this.isPhone(question)) {
      return new PhoneQuestion(question, testerId);
    } else if (this.isGender(question)) {
      return new GenderQuestion(question, testerId);
    } else if (this.isAddress(question)) {
      return new AddressQuestion(question, testerId);
    } else if (this.isSimpleText(question)) {
      return new SimpleTextQuestion(question, testerId);
    } else {
      return new Question(question);
    }
  }

  static isSelectable(
    question: QuestionType
  ): question is QuestionType & { type: "select" | "multiselect" | "radio" } {
    return (
      question.type === "select" ||
      question.type === "multiselect" ||
      question.type === "radio"
    );
  }

  static isCuf(question: QuestionType): question is QuestionType & {
    type: `cuf_${number}`;
  } {
    return !!question.type.match("^cuf_[0-9]+$");
  }

  static isPhone(question: QuestionType): question is QuestionType & {
    type: `phone_number`;
  } {
    return question.type === "phone_number";
  }

  static isGender(question: QuestionType): question is QuestionType & {
    type: `gender`;
  } {
    return question.type === "gender";
  }
  static isAddress(question: QuestionType): question is QuestionType & {
    type: `address`;
  } {
    return question.type === "address";
  }
  static isSimpleText(question: QuestionType): question is QuestionType & {
    type: `text`;
  } {
    return question.type === "text";
  }
}

export default QuestionFactory;
