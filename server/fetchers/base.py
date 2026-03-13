from abc import ABC, abstractmethod

class WordProvider(ABC):
    @abstractmethod
    def run(self) -> None:
        """
        Execute the word fetching logic and save the result (e.g., to a .txt file).
        """
        pass
