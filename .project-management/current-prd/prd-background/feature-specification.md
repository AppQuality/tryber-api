aggiungi al checker delle caratteristiche necessarie per vedere le campagne in users/me/campaigns le regole dei cuf.

Le CUF Rules sono delle regole per il dossier. Il dossier deve poter essere associato a delle coppie Custom User Field Id e Custom User Field Value che permettono di vedere la campagna solo se il tester che sta facendo la chiamata users/me/campaigns ha quel valore di cuf.

Il Target User è un tester.

Attualmente lo UserTargetChecker controlla solo country e lingua.

Dobbiamo controllare questi due test case:

- Se c'è una campagna con CUF rules e il tester ha quel valore di cuf allora vede la campagna
- Se c'è una campagna con CUF rules e il tester non ha quel valore di cuf allora non vede la campagna
