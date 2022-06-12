import {map, concat, slice } from "ramda";
import { isSymbolSExp, isEmptySExp, isCompoundSExp ,valueToString} from '../imp/L3-value';
import {  Exp, Program, isProgram, makeAppExp, ProcExp, VarDecl, Binding, isVarRef, isBoolExp, isNumExp,isPrimOp,isStrExp,LitExp, isIfExp, LetExp, LetPlusExp, isDefineExp, isAppExp, isLetExp,isLitExp, makeProcExp, AppExp, isProcExp, isLetPlusExp, PrimOp} from "./L31-ast";
import { Result, makeOk } from "../shared/result";

/*
Purpose: Transform L3 AST to JavaScript program string
Signature: l30ToJS(l2AST)
Type: [EXP | Program] => Result<string>
*/

export const l30ToJS = (exp: Exp | Program): Result<string>  => 
    makeOk(inverse_ParserL30(exp))


export const inverse_ParserL30 = (exp : Program | Exp): string =>
isBoolExp(exp) ? valueToString(exp.val) :
isStrExp(exp) ? valueToString(exp.val) :
isLitExp(exp) ? inverse_ParserLitExp(exp) :
isNumExp(exp) ? valueToString(exp.val) :
isPrimOp(exp) ? inverse_ParserPrimOp(exp) :
isLetExp(exp) ? inverse_ParserLetExp(exp) :
isVarRef(exp) ? exp.var :
isProcExp(exp) ? inverse_ParserProcExp(exp) :
isIfExp(exp) ? `(${inverse_ParserL30(exp.test)} ? ${inverse_ParserL30(exp.then)} : ${inverse_ParserL30(exp.alt)})` :
isAppExp(exp) ? inverse_ParserApp(exp) :
isLetPlusExp(exp) ? inverse_ParserLetPlusExp(exp) :
isDefineExp(exp) ? `const ${exp.var.var} = ${inverse_ParserL30(exp.val)}` :
isProgram(exp) ? inverse_ParserL_Exps(exp.exps) :
'exp';


const inverse_ParserLitExp = (exp : LitExp) : string =>
    isEmptySExp(exp.val) ? `'()` :
    isSymbolSExp(exp.val) ? `Symbol.for("${(exp.val.val)}")` :
    isCompoundSExp(exp.val) ? `'${valueToString(exp.val)}` :
    `${exp.val}`;
    

const inverse_ParserL_Exps = (exp_arr : Exp[]) : string =>
    map(inverse_ParserL30, exp_arr).join(";\n");


const inverse_ParserProcExp = (proc: ProcExp) : string => 
    `((${map((p: VarDecl) => p.var, proc.args).join(",")}) => ${inverse_ParserL_Exps(proc.body)})`


const inverse_ParserApp = (exp : Exp): string => 
isAppExp(exp) ? 
    isPrimOp(exp.rator) ?
        ["+", "-", "*", "/", ">", "<", "and", "or","=", "eq?", "string=?"].includes(exp.rator.op) ? 
            `(${map((x:Exp)=> inverse_ParserL30  (x) , exp.rands).join(inverse_ParserPrimOp(exp.rator))})` : 
            ["number?", "boolean?", "symbol?"].includes(exp.rator.op) ? 
                `${concat('((x) => (typeof (x) === ', slice(0,-1,exp.rator.op))}))` :
                `(${concat('!',inverse_ParserL30(exp.rands[0]))})`:
        concat(inverse_ParserL30(exp.rator),`(${map((x:Exp) => inverse_ParserL30(x), exp.rands).join(",")})`) :
'NULL' 


const inverse_ParserLetExp = (exp : LetExp) : string => 
    inverse_ParserL30(rewriteLet(exp))

    
const inverse_ParserLetPlusExp = (exp : LetPlusExp) : string => 
    `(let* (${map((b: Binding) => `(${b.var.var} ${inverse_ParserL30(b.val)})`,
     exp.bindings).join(" ")}) ${inverse_ParserL_Exps(exp.body)})`



const inverse_ParserPrimOp = (exp:PrimOp): string =>
["+", "-", "*", "/", ">", "<", "and", "or"].includes(exp.op) ? concat(concat(' ',exp.op),' ') :
["=", "eq?","string=?"].includes(exp.op) ? ' === ' :
`${concat('((x) => (typeof (x) === ', slice(0, -1, exp.op))}))` 


const rewriteLet = (exp: LetExp): AppExp => {
    const vars = map((bind) => bind.var, exp.bindings);
    const vals = map((bind) => bind.val, exp.bindings);
    return makeAppExp( makeProcExp(vars, exp.body) , vals);
}

