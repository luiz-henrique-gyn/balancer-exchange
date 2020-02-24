import { action, observable } from 'mobx';
import RootStore from 'stores/Root';
import { ValidationRules } from 'react-form-validator-core';
import {
    ExactAmountInPreview,
    ExactAmountOutPreview,
    Swap,
    SwapPreview,
} from './Proxy';
import { BigNumber } from 'utils/bignumber';
import {
    bnum,
    formatPctString,
    fromWei,
    isEmpty,
    str,
    toWei,
} from '../utils/helpers';

export const formNames = {
    INPUT_FORM: 'inputs',
};

export const labels = {
    inputs: {
        INPUT_TOKEN: 'Input Token',
        OUTPUT_TOKEN: 'Output Token',
        INPUT_AMOUNT: 'Input Amount',
        OUTPUT_AMOUNT: 'Output Amount',
    },
    outputs: {
        INPUT_AMOUNT: 'Input Amount',
        OUTPUT_AMOUNT: 'Output Amount',
        EFFECTIVE_PRICE: 'Effective Price',
        MARGINAL_PRICE: 'Marginal Price',
    },
};

export enum InputFocus {
    BUY,
    SELL,
}

export enum SwapMethods {
    EXACT_IN = 'swapExactIn',
    EXACT_OUT = 'swapExactOut',
}

export enum InputValidationStatus {
    VALID = 'Valid',
    EMPTY = 'Empty',
    ZERO = 'Zero',
    NOT_FLOAT = 'Not Float',
    NEGATIVE = 'Negative',
    INSUFFICIENT_BALANCE = 'Insufficient Balance',
    NO_POOLS = 'There are no Pools with selected tokens',
    MAX_DIGITS_EXCEEDED = 'Maximum Digits Exceeded',
}

export interface ChartData {
    validSwap: boolean;
    swaps: ChartSwap[];
    inputPriceValue: BigNumber;
    outputPriceValue: BigNumber;
}

export interface ChartSwap {
    isOthers: boolean;
    poolAddress?: string;
    percentage: number;
}

export default class SwapFormStore {
    @observable inputs = {
        inputToken: '',
        outputToken: '',
        inputAmount: '',
        outputAmount: '',
        extraSlippageAllowance: '1.0',
        extraSlippageAllowanceErrorStatus: InputValidationStatus.VALID,
        inputTicker: '',
        outputTicker: '',
        inputPrecision: 2,
        outputPrecision: 2,
        inputIconAddress: '',
        outputIconAddress: '',
        type: SwapMethods.EXACT_IN,
        outputLimit: '0',
        inputLimit: '0',
        limitPrice: '0',
        setBuyFocus: false,
        setSellFocus: false,
        swaps: [],
    };
    @observable outputs = {
        inputAmount: '',
        outputAmount: '',
        effectivePrice: '',
        spotPrice: '',
        expectedSlippage: '0',
        outputLimit: '',
        swaps: [],
        validSwap: false,
        activeErrorMessage: '',
    };
    @observable preview: SwapPreview;
    @observable tradeCompositionData: ChartData;
    @observable tradeCompositionOpen: boolean;
    @observable slippageSelectorOpen: boolean;
    @observable assetModalState = {
        open: false,
        input: 'inputAmount',
    };
    @observable assetSelectFilter: string = '';
    @observable slippageCell: number = 3;

    rootStore: RootStore;

    @action updateOutputsFromObject(output) {
        this.outputs = {
            ...this.outputs,
            ...output,
        };
    }

    @action updateInputsFromObject(output) {
        this.inputs = {
            ...this.inputs,
            ...output,
        };
    }

    @action setOutputFromPreview(
        method: SwapMethods,
        preview: ExactAmountInPreview | ExactAmountOutPreview
    ) {
        if (method === SwapMethods.EXACT_IN) {
            preview = preview as ExactAmountInPreview;
            this.inputs.outputAmount = fromWei(preview.totalOutput);
        } else if (method === SwapMethods.EXACT_OUT) {
            preview = preview as ExactAmountOutPreview;
            this.inputs.inputAmount = fromWei(preview.totalInput);
        } else {
            throw new Error('Invalid swap method specified');
        }

        this.preview = preview;

        this.outputs = {
            ...this.outputs,
            effectivePrice: str(preview.effectivePrice),
            spotPrice: str(preview.spotPrice),
            expectedSlippage: formatPctString(preview.expectedSlippage),
            swaps: preview.swaps,
            validSwap: true,
        };
    }

    @action setInputFocus(element: InputFocus) {
        if (element === InputFocus.BUY) {
            this.inputs.setSellFocus = false;
            this.inputs.setBuyFocus = true;
        } else if (element === InputFocus.SELL) {
            this.inputs.setBuyFocus = false;
            this.inputs.setSellFocus = true;
        } else {
            throw new Error('Invalid input focus element specified');
        }
    }

    @action setErrorMessage(message: string) {
        this.outputs.activeErrorMessage = message;
    }

    hasErrorMessage(): boolean {
        return !isEmpty(this.outputs.activeErrorMessage);
    }

    getErrorMessage(): string {
        return this.outputs.activeErrorMessage;
    }

    isValidStatus(value: InputValidationStatus) {
        return value === InputValidationStatus.VALID;
    }

    getSlippageCell() {
        return this.slippageCell;
    }

    @action setSlippageCell(value: number) {
        this.slippageCell = value;
    }

    getExtraSlippageAllowance(): string {
        return this.inputs.extraSlippageAllowance;
    }

    getSlippageSelectorErrorStatus(): InputValidationStatus {
        return this.inputs.extraSlippageAllowanceErrorStatus;
    }

    @action setExtraSlippageAllowance(value: string) {
        this.inputs.extraSlippageAllowance = value;
    }

    @action setSlippageSelectorErrorStatus(value: InputValidationStatus) {
        this.inputs.extraSlippageAllowanceErrorStatus = value;
    }

    @action clearErrorMessage() {
        this.outputs.activeErrorMessage = '';
    }

    @action setValidSwap(valid: boolean) {
        this.outputs.validSwap = valid;
    }

    @action setOutputAmount(value: string) {
        this.inputs.outputAmount = value;
    }

    @action setInputAmount(value: string) {
        this.inputs.inputAmount = value;
    }

    @action setTradeCompositionOpen(value) {
        this.tradeCompositionOpen = value;
    }

    @action setSlippageSelectorOpen(value) {
        this.slippageSelectorOpen = value;
    }

    @action setAssetModalState(value: { open?: boolean; input?: string }) {
        this.assetModalState = {
            ...this.assetModalState,
            ...value,
        };
    }

    @action switchInputOutputValues() {
        const {
            outputToken,
            outputTicker,
            outputIconAddress,
            outputPrecision,
            inputToken,
            inputTicker,
            inputIconAddress,
            inputPrecision,
        } = this.inputs;
        this.inputs.inputToken = outputToken;
        this.inputs.inputTicker = outputTicker;
        this.inputs.inputIconAddress = outputIconAddress;
        this.inputs.inputPrecision = outputPrecision;
        this.inputs.outputToken = inputToken;
        this.inputs.outputTicker = inputTicker;
        this.inputs.outputIconAddress = inputIconAddress;
        this.inputs.outputPrecision = inputPrecision;
    }

    @action clearInputs() {
        this.setInputAmount('');
        this.setOutputAmount('');
        this.clearErrorMessage();
    }

    @action setAssetSelectFilter(value: string) {
        this.assetSelectFilter = value;
    }

    isInputAmountStale(inputAmount: string | BigNumber) {
        return inputAmount.toString() !== this.inputs.inputAmount;
    }

    isOutputAmountStale(outputAmount: string | BigNumber) {
        return outputAmount.toString() !== this.inputs.outputAmount;
    }

    /* Assume swaps are in order of biggest to smallest value */
    @action setTradeCompositionEAI(preview: ExactAmountInPreview) {
        const {
            inputAmount,
            swaps,
            totalOutput,
            effectivePrice,
            validSwap,
        } = preview;
        this.setTradeComposition(
            SwapMethods.EXACT_IN,
            swaps,
            inputAmount,
            totalOutput,
            effectivePrice,
            validSwap
        );
    }

    /* Assume swaps are in order of biggest to smallest value */
    @action setTradeCompositionEAO(preview: ExactAmountOutPreview) {
        const {
            outputAmount,
            swaps,
            totalInput,
            effectivePrice,
            validSwap,
        } = preview;
        this.setTradeComposition(
            SwapMethods.EXACT_OUT,
            swaps,
            outputAmount,
            totalInput,
            effectivePrice,
            validSwap
        );
    }

    @action private setTradeComposition(
        method: SwapMethods,
        swaps: Swap[],
        inputValue: BigNumber,
        totalValue: BigNumber,
        effectivePrice: BigNumber,
        validSwap: boolean
    ) {
        let result: ChartData = {
            validSwap: true,
            inputPriceValue: bnum(0),
            outputPriceValue: bnum(0),
            swaps: [],
        };

        if (!validSwap) {
            result.validSwap = false;
            this.tradeCompositionData = result;
        }

        const others: ChartSwap = {
            isOthers: true,
            percentage: 0,
        };

        const tempChartSwaps: ChartSwap[] = [];
        // Convert all Swaps to ChartSwaps
        swaps.forEach(value => {
            const swapValue =
                method === SwapMethods.EXACT_IN
                    ? value.tokenInParam
                    : value.tokenOutParam;

            tempChartSwaps.push({
                isOthers: false,
                poolAddress: value.pool,
                percentage: bnum(swapValue)
                    .div(toWei(inputValue))
                    .times(100)
                    .dp(2, BigNumber.ROUND_HALF_EVEN)
                    .toNumber(),
            });
        });

        let totalPercentage = 0;

        tempChartSwaps.forEach((value, index) => {
            if (index === 0 || index === 1) {
                result.swaps.push(value);
            } else {
                others.percentage += value.percentage;
            }

            totalPercentage += value.percentage;
        });

        if (others.percentage > 0) {
            result.swaps.push(others);
        }

        if (method === SwapMethods.EXACT_IN) {
            result.inputPriceValue = inputValue;
            result.outputPriceValue = bnum(fromWei(totalValue));
        }

        if (method === SwapMethods.EXACT_OUT) {
            result.inputPriceValue = bnum(fromWei(totalValue));
            result.outputPriceValue = inputValue;
        }

        if (totalPercentage !== 100) {
            console.error('Total Percentage Unexpected Value');
        }

        this.tradeCompositionData = result;
    }

    @action clearTradeComposition() {
        this.resetTradeComposition();
    }

    isValidInput(value: string): boolean {
        return (
            this.getNumberInputValidationStatus(value) ===
            InputValidationStatus.VALID
        );
    }

    getNumberInputValidationStatus(
        value: string,
        options?: {
            limitDigits?: boolean;
        }
    ): InputValidationStatus {
        if (ValidationRules.isEmpty(value)) {
            return InputValidationStatus.EMPTY;
        }

        if (!ValidationRules.isFloat(value)) {
            return InputValidationStatus.NOT_FLOAT;
        }

        if (parseFloat(value).toString() === '0') {
            return InputValidationStatus.ZERO;
        }

        if (!ValidationRules.isPositive(value)) {
            return InputValidationStatus.NEGATIVE;
        }

        if (options && options.limitDigits) {
            // restrict to 2 decimal places
            const acceptableValues = [/^$/, /^\d{1,2}$/, /^\d{0,2}\.\d{0,2}$/];
            // if its within accepted decimal limit, update the input state
            if (!acceptableValues.some(a => a.test(value))) {
                return InputValidationStatus.MAX_DIGITS_EXCEEDED;
            }
        }

        return InputValidationStatus.VALID;
    }

    resetTradeComposition() {
        this.tradeCompositionData = {
            validSwap: false,
            inputPriceValue: bnum(0),
            outputPriceValue: bnum(0),
            swaps: [],
        };
    }

    constructor(rootStore) {
        this.rootStore = rootStore;
        this.resetTradeComposition();
    }
}