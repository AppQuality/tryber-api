import { AWSError, S3 } from "aws-sdk";

// const decomposeS3Url = (url: string): { bucket: string; key: string } => {
//   const { path } = parse(url);
//   const decodedPath = decodeURI(path || "");
//   const [, bucket, key] = decodedPath.match(/\/(.*?)\/(.*?)\/?$/) || [];
//   return { bucket, key };
// };

/**
 * Estrae bucket e key da un URL S3 (path-style o virtual-hosted–style).
 * Ritorna: { bucket, key, region, style }  dove style ∈ {"virtual-hosted", "path", "unknown"}
 * Lancia un errore se non riesce a determinare il bucket o la key.
 */
const decomposeS3Url = (input: string) => {
  if (typeof input !== "string" || !input.trim()) {
    throw new Error("URL S3 non valido.");
  }

  let url;
  try {
    url = new URL(input);
  } catch {
    throw new Error("URL non valido.");
  }

  // Rimuove query/hash e leading slash dal path
  const rawPath = url.pathname || "/";
  const path = rawPath.replace(/^\/+/, ""); // senza '/” iniziali
  const host = url.hostname;

  // Helpers
  const firstSeg = path.split("/")[0] || "";
  const restSegs = path.split("/").slice(1).join("/"); // potrebbe essere "" se root
  const decodeKey = (k: string) => {
    // decodeURIComponent non tocca gli slash, ma decodifica %20 ecc.
    try {
      return decodeURIComponent(k);
    } catch {
      // in casi patologici, ripiega sul valore originale
      return k;
    }
  };

  // 1) PATH-STYLE
  //    s3.<region>.amazonaws.com/<bucket>/<key>
  //    s3.dualstack.<region>.amazonaws.com/<bucket>/<key>
  //    s3.amazonaws.com/<bucket>/<key>  (region opzionale)
  const pathStyleRegex =
    /^(s3(?:-website)?(?:\.dualstack)?\.[a-z0-9-]+\.amazonaws\.com|s3\.amazonaws\.com)$/i;
  if (pathStyleRegex.test(host)) {
    // Estrai regione se presente
    let region = undefined;
    const regionMatch = host.match(
      /^s3(?:-website)?(?:\.dualstack)?\.([a-z0-9-]+)\.amazonaws\.com$/i
    );
    if (regionMatch) region = regionMatch[1];

    if (!firstSeg) throw new Error("Bucket mancante nel path-style URL.");
    const bucket = firstSeg;
    const key = decodeKey(restSegs || ""); // key può essere vuota (root dell’oggetto)

    if (key === "") {
      // per coerenza: in S3 l’oggetto root è raro, ma lo permettiamo
    }

    return { bucket, key, region, style: "path" };
  }

  // 2) VIRTUAL-HOSTED–STYLE
  //    <bucket>.s3.<region>.amazonaws.com/<key>
  //    <bucket>.s3.dualstack.<region>.amazonaws.com/<key>
  //    <bucket>.s3-accelerate.amazonaws.com/<key> (senza regione)
  //    <bucket>.s3-website.<region>.amazonaws.com/<key>
  //    <bucket>.s3.amazonaws.com/<key> (regionless)
  //    <bucket>.s3-object-lambda.<region>.amazonaws.com/<key>
  const virtualHostedMatch = host.match(
    /^(?<bucket>.+?)\.(?<service>s3(?:-accelerate|(?:-website)?|\.object-lambda)?)(?<dual>\.dualstack)?(?:\.(?<region>[a-z0-9-]+))?\.amazonaws\.com$/i
  );

  if (virtualHostedMatch?.groups?.bucket) {
    const bucket = virtualHostedMatch.groups.bucket;
    // Normalizza casi speciali: s3-accelerate non ha regione
    let region = virtualHostedMatch.groups.region || undefined;

    const key = decodeKey(path || ""); // tutto il path (senza leading slash)
    return { bucket, key, region, style: "virtual-hosted" };
  }

  // 3) Non sembra un endpoint S3 classico: proviamo fallback “s3 compatibile”
  //    Esempi self-hosted/minio con pattern simili: <bucket>.<host>/key oppure <host>/<bucket>/key
  //    Proviamo prima stile virtuale generico: <bucket>.<qualcosa>.<dominio>/key
  const genericVirtual = host.split(".");
  if (genericVirtual.length >= 3) {
    // Heuristica: tratta il primo label come bucket se path non inizia col bucket stesso
    const tentativeBucket = genericVirtual[0];
    if (tentativeBucket && path.length > 0) {
      return {
        bucket: tentativeBucket,
        key: decodeKey(path),
        region: undefined,
        style: "unknown",
      };
    }
  }
  // Fallback path-style generico: <host>/<bucket>/<key>
  if (firstSeg && restSegs) {
    return {
      bucket: firstSeg,
      key: decodeKey(restSegs),
      region: undefined,
      style: "unknown",
    };
  }

  throw new Error("Impossibile determinare bucket e key dall'URL fornito.");
};

export default async ({ url }: { url: string }) => {
  const { bucket, key } = decomposeS3Url(url);
  const awsCredentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  };
  const s3 = new S3(awsCredentials);
  try {
    await s3.headObject({ Bucket: bucket, Key: key }).promise();
  } catch (err) {
    if ((err as AWSError).statusCode === 404) {
      throw new Error("File not found");
    }
  }
  return s3.deleteObject({ Bucket: bucket, Key: key }).promise();
};

export { decomposeS3Url };
