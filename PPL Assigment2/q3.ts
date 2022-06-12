import {isDefineExp,makeDefineExp, CExp,isCExp, VarDecl, Exp, Program, isExp, isProgram, makeProgram,makeLetExp, isLetPlusExp, isAtomicExp, isLetExp, isLitExp, isIfExp, makeIfExp, isAppExp, isProcExp, makeProcExp, makeAppExp, LetPlusExp, LetExp, makeLetPlusExp, Binding, } from "./L31-ast";
import { makeOk, Result, makeFailure } from "../shared/result";
import {map} from "ramda";
import { first,second,rest } from "../shared/list";

/*
Purpose: Transform L31 AST to L3 AST
Signature: l31ToL3(l31AST)
Type: [Exp | Program] => Result<Exp | Program>
*/
export const L31ToL3 = (exp: Exp | Program): Result<Exp | Program> => 
    isExp(exp) ? makeOk(rewriteAllLetPlusExp(exp)) :
    isProgram(exp) ? makeOk(makeProgram(map(rewriteAllLetPlusExp, exp.exps))) :
    exp;
    
const rewriteAllLetPlusExp = (exp: Exp): Exp =>
    isCExp(exp) ? rewriteAllLetPlusCExp(exp) :
    isDefineExp(exp) ? makeDefineExp(exp.var, rewriteAllLetPlusCExp(exp.val)) :
    exp;

const rewriteAllLetPlusCExp = (exp: CExp): CExp =>
    isAtomicExp(exp) ? exp :
    isLitExp(exp) ? exp :
    isIfExp(exp) ? makeIfExp(rewriteAllLetPlusCExp(exp.test),
                            rewriteAllLetPlusCExp(exp.then),
                            rewriteAllLetPlusCExp(exp.alt)) :
    isAppExp(exp) ? makeAppExp(rewriteAllLetPlusCExp(exp.rator),
                            map(rewriteAllLetPlusCExp, exp.rands)) :
    isProcExp(exp) ? makeProcExp(exp.args, map(rewriteAllLetPlusCExp, exp.body)) :
    isLetExp(exp) ? makeLetExp(exp.bindings, map(rewriteAllLetPlusCExp, exp.body)) :
    isLetPlusExp(exp) ? rewriteAllLetPlusCExp(rewriteLetPlus(exp)):
    exp;

const rewriteLetPlus = (exp: LetPlusExp) : LetExp => {
    const vals : CExp[] = map((b) => b.val, exp.bindings);
    if (vals.length > 1){
        const faka1 = first(exp.bindings);
        const faka12 = [faka1];
        const faka2  = rest(exp.bindings);
        return makeLetExp(faka12 , [makeLetPlusExp(faka2, exp.body)]);
    } else{
        return makeLetExp(exp.bindings,exp.body)
    }
}
    
