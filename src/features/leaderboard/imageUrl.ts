import { hash } from "spark-md5";

export const imageUrl = ({
  name,
  surname,
  email,
}: {
  name: string;
  surname: string;
  email: string;
}) => {
  const fallback = `https://eu.ui-avatars.com/api/${name}+${surname}/132`;
  return `https://secure.gravatar.com/avatar/${hash(
    email
  )}?size=132&d=${encodeURIComponent(fallback)}`;
};
