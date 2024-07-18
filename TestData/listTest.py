def append_to_list(phrase_end, value):
    phrase_end.append(value)
    return phrase_end

# Assuming t2 is defined somewhere
t2 = 10  # Example value

phraseStart = [0]
phraseEnd = []

try:
    phraseEnd = append_to_list(phraseEnd, t2)
    print("Updated phraseEnd:", phraseEnd)
except Exception as e:
    print("Error during append operation:", e)