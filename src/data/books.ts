export type Book = {
  name: string;
  author: string;
  link: string;
};

export const Books: Book[] = [
  {
    name: 'The Count of Monte Cristo',
    author: 'Alexandre Dumas',
    link: 'https://www.goodreads.com/en/book/show/7126.The_Count_of_Monte_Cristo',
  },
  {
    name: 'Incerto',
    author: 'Nassim Nicholas Taleb',
    link: 'https://www.goodreads.com/series/164555-incerto',
  },
  {
    name: 'Shoe Dog',
    author: 'Phil Knight',
    link: 'https://www.goodreads.com/en/book/show/27220736-shoe-dog',
  },
  {
    name: 'Siddhartha',
    author: 'Hermann Hesse',
    link: 'https://www.goodreads.com/book/show/52036.Siddhartha',
  },
];
