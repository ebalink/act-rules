'use strict';

import { DomElement } from 'htmlparser2';
import _ from 'lodash';
import Rule from './Rule.object';

const stew = new (require('stew-select')).Stew();
import { AccessibilityTreeUtils} from '@qualweb/util';

import { ACTRule, ACTRuleResult } from '@qualweb/act-rules';

import {
    getElementSelector,
    transform_element_into_html,
    getContentHash
} from '../util';


const rule: ACTRule = {
    name: '`iframe` elements with identical accessible names have equivalent purpose',
    code: 'QW-ACT-R10',
    mapping: '4b1c6c',
    description: 'This rule checks that iframe elements with identical accessible names embed the same resource or equivalent resources.',
    metadata: {
        target: {
            element: 'iframe',
            attributes: ['src']
        },
        'success-criteria': [{
            name: '4.1.2',
            level: 'A',
            principle: 'Robust',
            url: 'https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html'
        }],
        related: [],
        url: 'https://act-rules.github.io/rules/4b1c6c',
        passed: 0,
        inapplicable: 0,
        failed: 0,
        warning:0,
        type: ['ACTRule', 'TestCase'],
        a11yReq: ['WCAG21:language'],
        outcome: '',
        description: ''
    },
    results: new Array<ACTRuleResult>()
};

class QW_ACT_R10 extends Rule {

    constructor() {
        super(rule);
    }

    async execute(element: DomElement | undefined,processedHTML: DomElement[], url: string): Promise<void> {
        let evaluation: ACTRuleResult = {
            verdict: '',
            description: '',
            resultCode: ''
        };

        let splittedUrl = url.split("://");
        let baseUrl ="http://"+splittedUrl[1].split("/")[0];

        if (element === undefined) { // if the element doesn't exist, there's nothing to test
            evaluation.verdict = 'inapplicable';
            evaluation.description = `body element doesn't exist`;
            evaluation.resultCode = 'RC1';
        } else {
           
            let iframes = stew.select( element,"iframe[src]");
            let accessibleNames: string[] = [];




            for (let iframe of iframes) {
                accessibleNames.push(AccessibilityTreeUtils.getAccessibleName(iframe, processedHTML,false));
            }

            let counter = 0;
            let hasEqualAn: number[];
            let blacklist: number[] = [];
            for (let accessibleName of accessibleNames) {
                hasEqualAn = [];
                if (blacklist.indexOf(counter) >= 0) {
                    //element already evaluated
                }
                else if (accessibleName && accessibleName.trim() !== "") {
                    hasEqualAn = this.isInListExceptIndex(accessibleName, accessibleNames, counter);
                    if (hasEqualAn.length > 0) {
                        blacklist.push(...hasEqualAn);
                        let result = true;
                        let resource = this.getAboluteUrl(iframes[counter].attribs["src"], baseUrl);
                        let resourceHash = await getContentHash(resource);//get resource hash do counter
                        for (let index of hasEqualAn) {
                            let currentIframe = iframes[index];
                            let src = this.getAboluteUrl(currentIframe.attribs["src"], baseUrl);
                            if (result && (resource !== src && await getContentHash(src) !== resourceHash)) {
                                result = false;
                            }
                        }
                        if (result) {//passed
                            evaluation.verdict = 'passed';
                            evaluation.description = `Iframes with the same accessible name have equal content`;
                            evaluation.resultCode = 'RC2';

                        } else { //failed
                            evaluation.verdict = 'warning';
                            evaluation.description = `Iframes with the same accessible name have different content`;
                            evaluation.resultCode = 'RC3';

                        }

                    } else {//inaplicable
                        evaluation.verdict = 'inapplicable';
                        evaluation.description = `There is no iframe with same the same accessible name`;
                        evaluation.resultCode = 'RC4';
                    }

                    evaluation.code = transform_element_into_html(iframes[counter]);
                    evaluation.pointer = getElementSelector(iframes[counter]);
                    super.addEvaluationResult(evaluation);
                    evaluation = {
                        verdict: '',
                        description: '',
                        resultCode: ''
                    };
                } else {//inaplicable
                    evaluation.verdict = 'inapplicable';
                    evaluation.description = `iframe doesnt have accessible name`;
                    evaluation.resultCode = 'RC4';
                    evaluation.code = transform_element_into_html(iframes[counter]);
                    evaluation.pointer = getElementSelector(iframes[counter]);
                    super.addEvaluationResult(evaluation);
                    evaluation = {
                        verdict: '',
                        description: '',
                        resultCode: ''
                    };

                }
                counter++;
            }

            if (iframes.length===0) {
                evaluation.verdict = 'inapplicable';
                evaluation.description = `iframe doesnt have accessible name`;
                evaluation.resultCode = 'RC4';
                super.addEvaluationResult(evaluation);
            }


        }





    }

  
    private getAboluteUrl(relativeUrl: string, baseUrl: string) {
        let reg = new RegExp("^/");
        let result = relativeUrl;
        if (reg.test(relativeUrl)) {
            result = baseUrl + relativeUrl;
        }

        return result;
    }
   
    private isInListExceptIndex(accessibleName: string, accessibleNames: string[], index: number) {
        let counter = 0;
        let result: number[] = [];
        for (let accessibleNameToCompare of accessibleNames) {
          if (accessibleNameToCompare === accessibleName && counter !== index) {
            result.push(counter);
          }
          counter++;
        }
    
        return result;
      }


}
export = QW_ACT_R10;
