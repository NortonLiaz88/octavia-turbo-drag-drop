/* eslint-disable react-hooks/rules-of-hooks */
import React, {
  Fragment,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useSharedValue, runOnUI } from 'react-native-reanimated';
import SortableWord from './SortableWord';
import Word from './Word';
import Placeholder from './Placeholder';
import Lines from './Lines';
import WordContext from './WordContext';
import { calculateLayoutWithNative } from '../compute/Layout';
import { ComputeWordLayout } from './ComputeWordLayout';
import type { DuoDragDropRef } from 'react-native-turbo-drag-drop';
import type { DuoDragDropProps } from '../@types';
import { styles } from '../utils/styles';

const DuoDragDrop = React.forwardRef<DuoDragDropRef, DuoDragDropProps>(
  (props, ref) => {
    const {
      target,
      words,
      extraData,
      renderWord,
      renderLines,
      renderPlaceholder,
      rtl,
      gesturesDisabled,
      wordBankAlignment = 'center',
      wordGap = 4,
      wordBankOffsetY = 20,
      wordHeight = 45,
      animatedStyleWorklet,
      onReady,
      onDrop,
    } = props;
    const lineHeight = props.lineHeight || wordHeight * 1.2;
    const lineGap = lineHeight - wordHeight;
    const [layout, setLayout] = useState<{
      numLines: number;
      wordStyles: StyleProp<ViewStyle>[];
    } | null>(null);
    const [containerWidth, setContainerWidth] = useState(0);

    const wordElements = useMemo(() => {
      return words.map((word, index) => (
        <WordContext.Provider
          key={`${word}-${index}`}
          value={{ wordHeight, wordGap, text: word }}
        >
          {renderWord?.(word, index) || <Word />}
        </WordContext.Provider>
      ));
      // Note: "extraData" provided here is used to force a re-render when the words change.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [words, wordHeight, wordGap, extraData, renderWord]);

    const offsets = words.map(() => ({
      order: useSharedValue(0),
      width: useSharedValue(0),
      height: useSharedValue(0),
      x: useSharedValue(0),
      y: useSharedValue(0),
      originalX: useSharedValue(0),
      originalY: useSharedValue(0),
    }));

    useImperativeHandle(ref, () => ({
      getWords: () => {
        const answeredWords: { word: string; order: number }[] = [];
        const bankWords: { word: string; order: number }[] = [];

        for (let i = 0; i < offsets.length; i++) {
          const offset = offsets[i];
          const word = words[i];

          if (word === undefined) continue;

          if (offset?.order.value !== -1) {
            answeredWords.push({ word, order: offset!.order.value });
          } else {
            bankWords.push({ word, order: offset.order.value });
          }
        }

        return {
          answered: answeredWords
            .sort((a, b) => a.order - b.order)
            .map((w) => w.word),
          bank: bankWords.sort((a, b) => a.order - b.order).map((w) => w.word),
        };
      },
      // Returns an array of words that are outside the "word bank"
      getAnsweredWords: () => {
        const answeredWords: { word: string; order: number }[] = [];

        for (let i = 0; i < offsets.length; i++) {
          const offset = offsets[i];
          if (offset?.order.value !== -1) {
            const word = words[i];
            if (word !== undefined) {
              answeredWords.push({ word, order: offset!.order.value });
            }
          }
        }

        return answeredWords
          .sort((a, b) => a.order - b.order)
          .map((w) => w.word); // ✅ 100% string[]
      },
      // Gets the order value of each word by their index
      getOffsets() {
        return offsets.map((o) => o.order.value);
      },
      // Animates the word buttons to move to new positions
      setOffsets(newOffsets: number[]) {
        // Extrai apenas os valores primitivos para passar para o Turbo Module
        const orders = offsets.map((o) => o.order.value);
        const widths = offsets.map((o) => o.width.value);

        const positions = calculateLayoutWithNative(
          orders,
          widths,
          containerWidth,
          wordHeight,
          wordGap,
          lineGap,
          !!rtl
        );

        runOnUI(() => {
          'worklet';

          // Atualiza os valores primitivos dos SharedValues
          for (let i = 0; i < newOffsets.length; i++) {
            offsets[i]!.order.value = newOffsets[i]!;
          }

          // Aplica os valores calculados
          for (let i = 0; i < positions.length; i++) {
            offsets[i]!.x.value = positions[i]!.x;
            offsets[i]!.y.value = positions[i]!.y;
          }
        })();
      },
      reorderWords: () => {
        // Step 1: Create a mapping of target words and their desired order
        const targetMap = new Map(target.map((word, index) => [word, index]));

        // Step 2: Identify words in the bank that should be in answered
        const wordsInBank: string[] = [];
        const wordsInAnswered: string[] = [];
        offsets.forEach((offset, index) => {
          const word = words[index];
          if (offset.order.value === -1) {
            wordsInBank.push(word!);
          } else {
            wordsInAnswered.push(word!);
          }
        });

        // Step 3: Fill missing words from the bank to answeredWords
        const completeAnsweredWords = [...wordsInAnswered];
        target.forEach((word) => {
          if (
            !completeAnsweredWords.includes(word) &&
            wordsInBank.includes(word)
          ) {
            completeAnsweredWords.push(word);
          }
        });

        // Step 4: Create an array with the new orders for each word
        const newOrders = words.map((word) => targetMap.get(word) ?? -1);

        // Step 5: Atualiza ordens diretamente na JS thread
        for (let i = 0; i < offsets.length; i++) {
          offsets[i]!.order.value = newOrders[i]!;
        }

        // Step 6: Prepara os dados para o cálculo nativo
        const orders = offsets.map((o) => o.order.value);
        const widths = offsets.map((o) => o.width.value);

        // Step 7: Executa o cálculo no TurboModule síncrono (Kotlin)
        const positions = calculateLayoutWithNative(
          orders,
          widths,
          containerWidth,
          wordHeight,
          wordGap,
          lineGap,
          !!rtl
        );

        console.log('Application Positions', positions);
        console.log(positions instanceof Promise);
        // Step 8: Aplica os resultados com runOnUI
        runOnUI(() => {
          'worklet';
          for (let i = 0; i < positions.length; i++) {
            offsets[i]!.x.value = positions[i]!.x;
            offsets[i]!.y.value = positions[i]!.y;
          }
        })();
      },

      reorderOneWord: () => {
        // Cria um array para rastrear índices já usados no target
        const usedIndices = new Array(target.length).fill(false);
        const newOrders = words.map((word) => {
          for (let i = 0; i < target.length; i++) {
            if (target[i] === word && !usedIndices[i]) {
              usedIndices[i] = true;
              return i;
            }
          }
          return -1; // Letra não encontrada ou já usada
        });

        // Atualiza ordens com base no target
        for (let i = 0; i < offsets.length; i++) {
          offsets[i]!.order.value = newOrders[i]!;
        }

        // Extrai valores para passar ao módulo nativo
        const orders = offsets.map((o) => o.order.value);
        const widths = offsets.map((o) => o.width.value);

        // Chama método síncrono nativo
        const positions = calculateLayoutWithNative(
          orders,
          widths,
          containerWidth,
          wordHeight,
          wordGap,
          lineGap,
          !!rtl
        );

        // Aplica os valores retornados via runOnUI
        runOnUI(() => {
          'worklet';
          for (let i = 0; i < positions.length; i++) {
            offsets[i]!.x.value = positions[i]!.x;
            offsets[i]!.y.value = positions[i]!.y;
          }
        })();
      },
    }));

    const initialized = layout && containerWidth > 0;

    useEffect(() => {
      if (initialized) {
        // Extrai valores para passar ao módulo nativo
        const orders = offsets.map((o) => o.order.value);
        const widths = offsets.map((o) => o.width.value);

        // Chamada ao TurboModule (ainda na JS thread)
        const positions = calculateLayoutWithNative(
          orders,
          widths,
          containerWidth,
          wordHeight,
          wordGap,
          lineGap,
          !!rtl
        );

        // Aplica os valores retornados na UI thread
        runOnUI(() => {
          'worklet';
          for (let i = 0; i < positions!.length; i++) {
            offsets[i]!.x.value = positions[i]!.x;
            offsets[i]!.y.value = positions[i]!.y;
          }
        })();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rtl]);
    useEffect(() => {
      // Notify parent the initialized status
      onReady?.(!!initialized);
    }, [initialized, onReady]);

    useEffect(() => {
      // Reset layout when user-provided measurements change
      setLayout(null);
    }, [wordBankOffsetY, wordBankAlignment, wordGap, wordHeight]);

    // We first have to render the (opacity=0) child components in order to obtain x/y/width/height of every word segment
    // This will allow us to position the elements in the Lines
    if (!initialized) {
      return (
        <ComputeWordLayout
          offsets={offsets}
          onContainerWidth={setContainerWidth}
          onLayout={setLayout}
          wordHeight={wordHeight}
          lineHeight={lineHeight}
          wordBankAlignment={wordBankAlignment}
          wordBankOffsetY={wordBankOffsetY}
          wordGap={wordGap}
        >
          {wordElements}
        </ComputeWordLayout>
      );
    }

    const { numLines, wordStyles } = layout;

    // Add an extra line to account for certain word combinations that can wrap over to a new line
    const idealNumLines = numLines < 3 ? numLines + 1 : numLines;
    const linesContainerHeight = idealNumLines * lineHeight || lineHeight;
    /** Since word bank is absolutely positioned, estimate the total height of container with offsets */
    const wordBankHeight =
      numLines * (wordHeight + wordGap * 2) + wordBankOffsetY * 2;

    const PlaceholderComponent = renderPlaceholder || Placeholder;
    const LinesComponent = renderLines || Lines;

    return (
      <View style={styles.container}>
        <LinesComponent
          numLines={idealNumLines}
          containerHeight={linesContainerHeight}
          lineHeight={lineHeight}
        />
        <View style={{ minHeight: wordBankHeight }} />
        {wordElements.map((child, index) => (
          <Fragment key={`${words[index]}-f-${index}`}>
            {renderPlaceholder === null ? null : (
              <PlaceholderComponent style={wordStyles[index] as any} />
            )}
            <SortableWord
              offsets={offsets}
              index={index}
              rtl={Boolean(rtl)}
              containerWidth={containerWidth}
              gesturesDisabled={Boolean(gesturesDisabled)}
              linesHeight={linesContainerHeight}
              lineGap={lineGap}
              wordHeight={wordHeight}
              wordGap={wordGap}
              wordBankOffsetY={wordBankOffsetY}
              animatedStyleWorklet={animatedStyleWorklet}
              onDrop={onDrop}
            >
              {child}
            </SortableWord>
          </Fragment>
        ))}
      </View>
    );
  }
);

export default DuoDragDrop;
