import * as R from "ramda";

const stringToArray = R.split("");

/* Question 1 */
export const countLetters : (s : string) => {[index : string] : number;} 
 = R.pipe(R.replace(/\s/g, ""), R.toLower, R.countBy((c : string) => c));   

/* Question 2 */
export const isPaired : (s: string) => boolean = function (s : string) : boolean {

let array = stringToArray(s);

let counter : number = R.reduce((acc : number, curr : string) =>
( curr === "{" || curr === "[" || curr === "(" ) ? acc + 1 :
( curr === "}" || curr === "]" || curr === ")" ) ? acc - 1 :
acc , 0, array);

let s2 = R.reduce((acc : string[], curr : string) =>
(curr === "{" || curr === "[" || curr === "(" ) ? R.insert(acc.length, curr, acc) : 
( curr === "}" && acc[acc.length-1] === "{" ) ? R.slice(0,-1, acc) :
( curr === "]" && acc[acc.length-1] === "[" ) ? R.slice(0,-1, acc) :
( curr === ")" && acc[acc.length-1] === "(" ) ? R.slice(0,-1, acc) :
acc ,<string[]>[], array);


return counter === 0 && s2.length === 0 ? true : false;

}

/* Question 3 */
export interface WordTree {
    root: string;
    children: WordTree[];
}

export const treeToSentence : (t: WordTree) => string  = function (t: WordTree) : string {
  let treeString = (t: WordTree): string => {
    if (t.children.length === 0){
      return t.root + " ";
    } else {
      let acc = "";
      let out = (t.root +" ").concat(R.reduce((acc:string, curr:WordTree) => acc + treeString(curr), acc, t.children));
      return out;
    }
  }
  let a =treeString(t);
  let b = R.slice(0, -1, a);
  return b;
}