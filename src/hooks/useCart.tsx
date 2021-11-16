import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      // TODO
      const productAlreadyInCart = cart.find(product => product.id === productId);

      if(!productAlreadyInCart) {
        const { data: product } = await api.get<Product>(`products/${productId}`)
        const { data: stock } = await api.get<Stock>(`stock/${productId}`)

        if (stock.amount > 0) {
          setCart([...cart, { ...product, amount: 1 }])
          localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart, { ...product, amount: 1 }]))
          toast.success('Produto adicionado!');
        }
      } 

      if (productAlreadyInCart) {
      const { data: stock } = await api.get<Stock>(`stock/${productId}`)
      if ( stock.amount > productAlreadyInCart.amount ) {
        const updateCart = cart.map(cartItem => cartItem.id === productId ? {
          ...cartItem,
          amount: Number(cartItem.amount) + 1
        } : cartItem)

        setCart(updateCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updateCart))
        toast.success('Produto adicionado!');
        return
      } 

      toast.error('Quantidade solicitada fora de estoque');
      return
    }


    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productExistsInCart = cart.some(product => product.id === productId);

      if(!productExistsInCart) {
        toast.error('Erro na remoção do produto');
        return
      }

      const removedProduct = cart.filter(product => product.id !== productId)
      setCart(removedProduct)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(removedProduct))

    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount < 1) {
        toast.error('Erro na alteração de quantidade do produto');
        return
      }

      const { data: stock } = await api.get<Stock>(`stock/${productId}`)
      const stockNotAvailable = amount > stock.amount

      if (stockNotAvailable) {
        toast.error('Quantidade solicitada fora de estoque');
        return
      }

      const productExistsInCart = cart.some((product) => product.id === productId)

      if(!productExistsInCart) {
        toast.error('Erro na alteração de quantidade do produto');
        return
      }

      const updatedProduct = cart.map((product) => product.id === productId ? {
        ...product, 
        amount: amount
      } : product);

      setCart(updatedProduct)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedProduct))
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
